const express = require('express');
const fileUpload = require('express-fileupload');
const fileExtLimiter = require('./middleware/fileExtLimiter');
const csv = require('csv-parser')
var kanjidate = require("kanjidate");

const fs = require('fs')
const results = [];
const path = require('path');
const app = express();
var fileName;

let resArr = [];
var resObj = {};

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
});

app.post(".netlify/functions/upload",
    fileUpload({
        createParentPath: true
    }),

    fileExtLimiter([".csv"]),

    (req, res) => {
        const files = req.files
        console.log(files)

        Object.keys(files).forEach(key => {
            const filepath = path.join(__dirname, 'files', files[key].name)
            files[key].mv(filepath, (err) => {
                if (err) return res.status(500).json({
                    status: "error",
                    message: err
                })
            })

            fileName = path.join(__dirname, 'files', files[key].name);

            fs.createReadStream(fileName)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                   // console.log(results);
                    const CSVOut = results;

                    //clear the current array
                    resArr = [];
                    resObj = {};

                    Object.keys(CSVOut).forEach(key => {
                        if (CSVOut[key].Key == "stress") {
                            resObj = {};
                            //parse the timestamp
                            var unixSeconds = (key, CSVOut[key].Time).toString();
                            var unixMilliSeconds = unixSeconds * 1000;
                            var myDate = new Date(unixMilliSeconds);
                            myDate = kanjidate.format(kanjidate.fSqlDateTime,new Date(unixMilliSeconds));
                           // myDate = myDate.toString().slice(0, -31);
                        
                            //parse the stress level
                            var stressLvl = (key, CSVOut[key].Value).toString();
                            stressLvl = (stressLvl.slice(-3));
                            stressLvl = (stressLvl.slice(0, -1));

                            resObj.time = myDate;
                            resObj.value = stressLvl;

                            resArr.push(resObj);
                        }
                    })
                    console.log(resArr);

                    app.get('/stressData', (req, res) => {
                        res.json(resArr);
                    });
                });

       })

        return res.json({
            status: 'success',
            message: Object.keys(files).toString()
        })
    }
)





app.listen(3000, () => {
    console.log("App listening on port 3000")
})