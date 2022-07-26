const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.my6ni.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect()


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }

async function run (){
    try{
        await client.connect();
        const partsCollection = client.db('moto_gears').collection('parts');
        const userCollection = client.db('moto_gears').collection('users');
        const orderCollection = client.db('moto_gears').collection('orders')
        const reviewCollection = client.db('moto_gears').collection('reviews')

        const verifyAdmin = async(req, res, next) => {
          const requester = req.decoded.email;
          const requesterAccount = await userCollection.findOne({ email: requester });
          if (requesterAccount.role === 'admin'){
            next()
          }
          else{
            res.status(403).send({message: 'forbidden'});
          }
        };

        app.post('/parts', async(req, res) =>{
          const newParts = req.body;
          const result = await partsCollection.insertOne(newParts);
          res.send({success: true, result})

        });

        app.post('/review', async(req, res) =>{
          const review = req.body;
          const result = await reviewCollection.insertOne(review);
          res.send({success: true, result})

        });

        app.get('/review', async (req, res) => {
          const review = await  reviewCollection.find().toArray();
          res.send(review);
        });

         app.get('/parts', async(req, res)=>{
              const query = {};
              const cursor = partsCollection.find(query)
              const services = await cursor.toArray();
              res.send(services)

             });

         app.get('/parts/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const item = await partsCollection.findOne(query);
            res.send(item)
          });  

          app.delete('/parts/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await partsCollection.deleteOne(query);
            res.send(result);
        });


          app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
          });

          app.get('/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const user = await userCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin})
          })
          
          app.put('/decreaseQty/:id', async(req, res) =>{
            const id = req.params.id;
            const qty = req.body.newQuantity;
            const filter = {_id: ObjectId(id)};
            const options = { upsert: true};
            const updatedDoc = {
                $set: {
                      qty: qty
                }
            }
            const result = await partsCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
          });

          app.put('/increaseQty/:id', async(req, res) =>{
            const id = req.params.id;
            const qty = req.body.newQuantity;
            const filter = {_id: ObjectId(id)};
            const options = { upsert: true};
            const updatedDoc = {
                $set: {
                      qty: qty
                }
            }
            const result = await partsCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
          });

          app.put('/user/admin/:email', verifyJWT,verifyAdmin, async (req, res) => {
            const email = req.params.email;
              const filter = { email: email };
              const updateDoc = {
                $set: { role: 'admin' },
              };
              const result = await userCollection.updateOne(filter, updateDoc);
              res.send(result);
          })

          app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' })
            res.send({ result, token });
          });

          app.post('/order', async(req, res) =>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send({success: true, result})
        });

        app.get('/order', verifyJWT, async (req, res) => {
          const user = req.query.user;
          const decodedEmail = req.decoded.email;
          if (user === decodedEmail) {
            const query = { user: user };
            const order = await orderCollection.find(query).toArray();
            return res.send(order);
          }
          else {
            return res.status(403).send({ message: 'forbidden access' });
          }
        });

        app.get('/orders', async (req, res) => {
          const query = {};
          const cursor = orderCollection.find(query)
          const orders = await cursor.toArray();
          res.send(orders)
        });
        
    }

    finally{

    }
};
run().catch(console.dir)

app.get('/', (req, res)=> {
    res.send('Hello from moto gears')
});

app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});