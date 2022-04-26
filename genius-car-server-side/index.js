const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const jwt = require('jsonwebtoken')
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.glbyw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauth accessed' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden" })
        }

        req.decoded = decoded;
        next();

    })


}
async function run() {
    await client.connect();
    const collection = client.db("genius-car").collection("services");
    const orderCollection = client.db("genius-car").collection("orders");
    //auth

    app.post('/login', async (req, res) => {

        const user = req.body;
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
            expiresIn: '1d'

        });

        res.send(accessToken);

    })
    app.get('/services', async (req, res) => {
        const query = {};
        const cursor = await collection.find(query).toArray();

        res.send(cursor);

    })
    app.post('/services', async (req, res) => {

        const newService = req.body;
        const toDb = await collection.insertOne(newService);
        res.send({ Success: 'service added' })
    })
    app.put('/services/:id', async (req, res) => {
        const id = req.params.id;
        const { name, price, img, description } = req.body;

        const query = { _id: ObjectId(id) }
        const options = { upsert: true };
        const update = {
            $set: {
                img: img,
                name: name,
                price: price,
                description: description

            }
        }
        const result = await collection.updateOne(query, update, options)
        res.send({ Update: "Update iS SuccessFull" })
    })
    app.delete('/services/:id', async (req, res) => {
        const id = req.params.id;
        const query = {
            _id: ObjectId(id)
        }
        const result = await collection.deleteOne(query);
        res.send(result);
    })
    app.get('/services/:id', async (req, res) => {

        const query = { _id: ObjectId(req.params.id) };
        const db = await collection.findOne(query);

        res.send(db);
    })

    //order

    app.get('/orders', verifyJWT, async (req, res) => {

        const decodedEmail = req.decoded.email;
        console.log('dc email', decodedEmail)
        const { email } = req.query;

        if (email === decodedEmail) {
            const query = { email: email };
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            console.log(query);
            res.send(orders);

        }
        else {
            res.status(403).send({ message: 'Forbbidden Accesss' })
        }


    })

    app.post('/order', async (req, res) => {

        const order = req.body;
        const posting = await orderCollection.insertOne(order);
        res.send(posting)
    })

}

run().catch(console.dir)
app.get('/', (req, res) => {
    res.send('Running Server')
})
app.listen(port, () => {
    console.log('Listening')
})
