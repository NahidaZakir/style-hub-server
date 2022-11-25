const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gj8nsdx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {
    try {
        const categoryCollection = client.db('styleHub').collection('category');
        const productsCollection = client.db('styleHub').collection('products');

        app.get('/category', async (req, res) => {
            const query = {};
            const categories = await categoryCollection.find(query).toArray();
            res.send(categories);
        });
        app.get('/category/:id', async (req, res) => {
            const id = parseInt(req.params.id);

            const query = { categoryId: id };
            console.log(query);
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })



    }
    finally {

    }
}
run().catch(error => {
    console.log(error);
});

app.get('/', async (req, res) => {
    res.send('Style hub server is running');
})

app.listen(port, () => console.log(`Style hub running on ${port}`))