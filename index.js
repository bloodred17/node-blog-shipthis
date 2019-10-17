const express = require('express');
const app = express();

const cors = require('cors');
const port = process.env.PORT || 3000;

const { MongoClient, ObjectID } = require('mongodb');
const dbUrl = 'mongodb://localhost:27017/Blog-shipThis';

app.use(cors());
app.use(express.json());

// ---------------------Setting up MongoDB server
MongoClient.connect( dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err, client) => {
    if( err ){
        return console.log('Unable to connect to MongoDB');
    }
    console.log('Connected to MongoDB server');
    //Change database name
    const db = client.db('blog-shipthis');

    // ----------------------Setting up API route for POST request
    app.post('/api/blog', (req, res) => {
        if(!req.body.title || req.body.title.length < 3){
            // 400 Bad request
            res.status(400).send('Title is required and should be minimum 3 characters');
            return;
        } else if(!req.body.content || req.body.content.length < 20){
            // 400 Bad request
            res.status(400).send('Content is required and should be minimum 20 characters');
            return;
        } else if(!req.body.dateCreated){
            // 400 Bad request
            res.status(400).send('Date Created is required');
            return;
        } else if(!req.body.dateModified){
            req.body.dateModified = req.body.dateCreated;
        } else if(!req.body.tags){
            req.body.tags = [];
            req.body.tags.push('General');
        }

        // -------------Creating blog-data from request-body 
        const blogData = {
            title: req.body.title,
            content: req.body.content,
            tags: req.body.tags,
            dateCreated: req.body.dateCreated,
            dateModified: req.body.dateModified
        };

        // ----------Adding data to Database
        db.collection('blog').insertOne(blogData, (err, result) => {
            if(err){
                return console.log('Unable to insert blog-data ', err);
            }
            console.log(JSON.stringify(result.ops, undefined, 2));
            res.send(result);
        });
    });

    // ---------------------Setting up API route for GET request
    app.get('/api/blog/all', (req, res) => {
        db.collection('blog').find().toArray().then((docs) => {
            console.log('Blogs');
            console.log(JSON.stringify(docs, undefined, 2));
            res.send(docs);
        }, (err) => {
            console.log("Unable to fetch ", err);
            res.send('Unable to fetch', err);
        });
    });
        // ---------Getting by _id
    app.get('/api/blog/:id', (req, res) => {
        db.collection('blog').find({ _id: new ObjectID(req.params.id) }).toArray().then((doc) => {
            console.log('Blog:');
            console.log(JSON.stringify(doc, undefined, 2));
            res.send(doc);
        }, (err) => {
            console.log("Unable to fetch ", err);
            res.send('Unable to fetch', err);
        });
    });

    // --------------------Setting up API route for DELETE request
    app.delete('/api/blog/:id', (req, res) => {
        db.collection('blog').findOneAndDelete({ _id: new ObjectID(req.params.id) }).then((doc) => {
            console.log('Deleting Blog: ');
            console.log(doc);
            res.send(doc);
        }, (err) => {
            console.log("Unable to fetch ", err);
            res.send('Unable to fetch', err);
        });
    });

    // -----------------------Settin up API route for PUT request
    app.put('/api/blog/:id', (req, res) => {
        const update = {};
        if(!req.body.dateModified){
            // 400 Bad request
            res.status(400).send('Data modified is required and should be after than date created');
            return;
        }
        for(let key in req.body){
            update[key] = req.body[key];
        }
        db.collection('blog').findOneAndUpdate({ _id: new ObjectID(req.params.id) }, { $set: update }, { returnOriginal: false }).then((result) => {
            console.log('Updated Blog: ');
            console.log(result);
            res.send(result);
        }, (err) => {
            console.log('Unable to fetch ', err);
            res.send('Unable to fetch ', err);
        });
    });
    
    // -----------------Closing the Database
    client.close();
});

app.listen(port, () => {
    console.log(`Listening on ${port}`);
});