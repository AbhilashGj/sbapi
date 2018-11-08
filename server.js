const express=require('express');
const bodyParser=require('body-parser');
const bcrypt=require('bcrypt-nodejs');
const cors=require('cors');
const knex=require('knex');

const dab=knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'Abhilash',
    password : '',
    database : 'smart-brain'
  }
});

dab.select('*').from('users').then(data=>{
	console.log(data);
});

const app=express();

app.use(bodyParser.json());
app.use(cors());

const db={
	users:
	[
		{
			id:'123',
			name:'jon',
			email:'jon@gmail.com',
			count:0,
			pwd:'cookies',
			joined:new Date()
		},
		{
			id:'124',
			name:'sally',
			email:'sally@gmail.com',
			count:0,
			pwd:'sally',
			joined:new Date()
		}
	],
	login:[
	{
		id:'987',
		hash:'',
		email:'jon@gmail.com'
	}]
}

app.get('/',(req,res)=>{
	res.send(db.users);
	//res.send('this is working');
})

app.post('/signin',(req,res)=>{
	dab.select('email','hash').from('login')
	.where('email','=',req.body.email)
	.then(data=>{
		const isValid=bcrypt.compareSync(req.body.pwd,data[0].hash);
			if(isValid)
			{
				return dab.select('*').from('users')
				.where('email','=',req.body.email)
				.then(user=>{
					res.json(user[0])
				})
				.catch(err=>res.status(400).json('unable to get user'))
			}
			else
			{
				res.status(400).json('wrong credentials')
			}
	})
	.catch(err=>res.status(400).json('wrong credentials'));
})

app.post('/register',(req,res)=>{
	const {email,name,pwd}=req.body;
	const hash=bcrypt.hashSync(pwd);
	dab.transaction(trx=>{//for more than 2 things at once
		trx.insert({
			hash:hash,
			email:email
		})
		.into('login')
		.returning('email')
		.then(loginEmail=>{
		return trx('users').returning('*').insert({
		email:loginEmail[0],
		name:name,
		joined:new Date()
	})
		.then(user=>{
	res.json(user[0]);
	})
	})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err=>res.status(400).json(err))
})


app.get('/profile/:id',(req,res)=>{
	const {id}=req.params;
	dab.select('*').from('users').where({id}).then(user=>{
	if(user.length)
	{
		res.json(user[0])
	}
	else
	{
		res.status(400).json("Not found")
	}
})
	.catch(err=>res.status(400).json("Not found"))
})

app.put('/image',(req,res)=>{
	const {id}=req.body;
	dab('users').where('id','=',id)
	.increment('entries',1)
	.returning('entries')
	.then(entries=>{
		res.json(entries[0])
	})
	.catch(err=>res.status(400).json('unable to get entries'))
})


//load hash from your pw  d db

app.listen(3000,()=>{
	console.log('running');
})