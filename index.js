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
        const usersCollection = client.db('styleHub').collection('users');
        const bookingsCollection = client.db('styleHub').collection('bookings');
        const sellersCollection = client.db('styleHub').collection('sellers');

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }


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
        app.get('/categoryName', async (req, res) => {
            const query = {}
            const result = await categoryCollection.find(query).project({ categoryName: 1 }).toArray();
            res.send(result);
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = {};
            const allUsers = await usersCollection.find(query).toArray();
            const check = allUsers.filter(eachUser => eachUser === user)
            console.log(check);
            if (check.length === 0) {
                const result = await usersCollection.insertOne(user);
                res.send(result);
            }
            else {
                res.send();
            }


        });

        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const query = {
                email: booking.email,
                productName: booking.productName
            }

            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have booked this product`;
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        app.get('/products/:email', async (req, res) => {
            const email = req.params.email;
            const query = { sellerEmail: email };
            const sellerProducts = await productsCollection.find(query).toArray();
            res.send(sellerProducts);
        })

        app.get('/products', verifyJWT, verifyAdmin, async (req, res) => {
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })

        app.post('/products', verifyJWT, async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        app.delete('/products/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        });
        app.get('/sellers', async (req, res) => {
            const account = req.query.accountType;
            console.log(account);
            const query = { accountType: account };
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        });

        app.post('/sellers', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = {};
            const allUsers = await usersCollection.find(query).toArray();
            const check = allUsers.filter(eachUser => eachUser === user)
            console.log(check);
            if (check.length === 0) {
                const result = await usersCollection.insertOne(user);
                res.send(result);
            }
            else {
                res.send();
            }
        });

        app.delete('/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });
        app.get('/buyers', async (req, res) => {
            const account = req.query.accountType;
            console.log(account);
            const query = { accountType: account };
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        });



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