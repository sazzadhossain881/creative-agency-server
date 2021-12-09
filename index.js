const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors');
const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();




const fileUpload = require('express-fileupload');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ot8dd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const app = express();
app.use(bodyParser.json());
app.use(express.static('orders'))
app.use(fileUpload());
app.use(cors());


app.get('/', (req, res) => {
    res.send('creative agency is working');
})






const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const servicesCollection = client.db("creative-agency").collection("services");
    const reviewsCollection = client.db("creative-agency").collection("reviews");
    const ordersCollection = client.db("creative-agency").collection("orders");
    const adminCollection = client.db("creative-agency").collection("adminEmail");



    // perform actions on the collection object

    app.post('/addOrder', (req, res) => {
        const name = req.body.name;
        const email = req.body.email;
        const file = req.files.file;
        const service = req.body.service;
        const description = req.body.description;
        const price = req.body.price;
        const status = req.body.status;
        const date = new Date().toDateString();
        const filePath = `${__dirname}/orders/${file.name}`;


        console.log(name, email, file, service, description, price, date);
        file.mv(filePath, error => {
            if (error) {
                console.log(error);
                res.status(500).send({ msg: 'Failed to upload image' })
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');
            var image = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer(encImg, 'base64')
            };
            ordersCollection.insertOne({ name, email, file, service, image, description, price, status, date })
                .then(result => {
                    fs.remove(filePath, error => {
                        if (error) {
                            console.log(error);
                        }
                    })
                    res.send(result.insertedCount > 0)
                })
            // return res.send({ name: file.name, path: `/${file.name}` })
        })

    })

    app.get('/getOrder', (req, res) => {
        ordersCollection.find({ email: req.query.email })
            .toArray((error, documents) => {
                res.send(documents)
            })
    })

    app.get('/allOrders', (req, res) => {
        ordersCollection.find({})
            .toArray((error, documents) => {
                res.send(documents)
            })
    })

    app.post('/addService', (req, res) => {

        const file = req.files.file;
        const name = req.body.name;
        const description = req.body.description;
        const filePath = `${__dirname}/orders/${file.name}`;


        file.mv(filePath, error => {
            if (error) {
                console.log(error);
                res.status(500).send({ msg: 'Failed to upload image' })
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');
            var image = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer(encImg, 'base64')
            };
            servicesCollection.insertOne({ name, file, image, description })
                .then(result => {
                    fs.remove(filePath, error => {
                        if (error) {
                            console.log(error);
                        }
                    })
                    res.send(result.insertedCount > 0)
                })
            // return res.send({ name: file.name, path: `/${file.name}` })
        })




    })




    app.get('/getServices', (req, res) => {
        servicesCollection.find({})
            .toArray((error, documents) => {
                res.send(documents);
            })
    })

    app.post('/addReviews', (req, res) => {
        const review = req.body;
        reviewsCollection.insertOne(review)
            .then((result) => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/getReviews', (req, res) => {
        reviewsCollection.find({}).sort({ _id: -1 }).limit(3)
            .toArray((error, documents) => {
                res.send(documents)
            })

    })

    app.post('/addAdmin', (req, res) => {
        const email = req.body;
        adminCollection.insertOne(email)
            .then((result) => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/getAdmin', (req, res) => {
        const email = req.query.email;
        adminCollection.find({ email: email })
            .toArray((error, documents) => {
                res.send(documents.length > 0);
            })
    })

    app.patch('/update/:id', (req, res) => {
        ordersCollection.updateOne({ _id: ObjectId(req.params.id) }, {
            $set: { status: req.body.status }
        })
            .then((result) => {
                res.send(result.modifiedCount > 0)
            })
    })




    console.log('database connected');
});











app.listen(5000);