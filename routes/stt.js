var express = require('express');
var router = express.Router();
var multer = require('multer');
var OpenAI = require('openai')
var { Readable } = require('stream')
var fs = require('fs')
var openai_uploads = require('openai/uploads')


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const openai = new OpenAI();

/* GET users listing. */
router.post('/', upload.single('file'), async function(req, res, next) {
    console.log(req.file);
    const file = await openai_uploads.toFile(Readable.from(req.file.buffer), `${Date.now()}.mp3`)
    openai.audio.translations.create({
        file: file,
        model: 'whisper-1',
    })
        .then((transcript) => {
            var d = new Date();
            openai.chat.completions.create({
            model:"gpt-3.5-turbo",
            messages: [{
                role:"system",
                content: `${d.toLocaleString()} You will be given a note from a caregiver about a patient who they are taking care of. You have to split this note up into information about the following categories and return the categorized information to the user. The categories are Heart Rate, Blood Pressure, Sleep, Oxygen Level, Breathing Rate, Temperature, Glucose, Weight, Entertainment, Exercise, Food, Medication, Therapy, Toileting. Any other information will be in a category called "Other". Each event should be given in the following format: [Category | Time(am/pm format) | Date | Description]. At the beginning of the message you will get the date and time that the note is being taken. If any time information is missing from an event, use the date and time of the note and place an 'r' in front of it. If the message is of topic, respond with "NULL"`
            },
                {
                    role: "user",
                    content: transcript.text
                }
            ]
        }).then((structured_data) => {
            res.send(structured_data);
        })
        }).catch((e) => console.log(e));
});


module.exports = router;
