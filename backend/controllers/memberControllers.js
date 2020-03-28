const Member = require('../models/member')
const fs = require('fs')
const _ = require('lodash')
const formidable = require('formidable')


//avoid returning hashed_password to user
exports.read = (req,res) => {
	req.profile.hashed_password = undefined
	return res.json(req.profile)
}

exports.memberMiddleware =(req,res,next) => {
	const memberId = req.user._id
	Member.findById({_id: memberId}).exec((error,member)=>{
		if(error){
			return res.status(400).json({
				error: 'Please log in to access this feature'
			})
		}
		req.profile = member
		next()
	})
}

exports.adminMiddleware =(req,res,next) => {
	const adminId = req.user._id
	Member.findById({_id: adminId}).exec((error,member)=>{
		if(error){
			return res.status(400).json({
				error: 'Please log in to access this feature'
			})
		}

		if(member.role !== 'admin'){
			return res.status(400).json({
				error: 'This feature is for Admin'
			})
		} 

		/*req.profile = member*/
		//req.profile is a newly created property, 
		next()
	})
}

exports.updateMember = () => {
	const form = formidable.IncomingForm()
	form.parse(req,(error,fields,files)=>{
		if(error){
			return res.status(400).json({
				error: error
			})
		}
		let member = req.profile
		member = _.extend(member,fields)

		if(files.photo) {
			if(files.photo.size > 100000) {
				return res.status(400).json({
					error: 'Image size should be less than 1MB'
				})
			}
			member.photo.data = fs.readFileSync(files.photo.data)
			member.photo.contentType = files.photo.type

			member.save((error,result)=>{
				if(error){
					return res.status(400).json({
						error: error
					})
				}
				member.hashed_password = undefined
				res.json(member)
			})

		}
	})
}

exports.photo = (req,res) => {
	const username = req.params.username
	Member.findOne({username}).exec((error,member)=>{
		if(error || !member) {
			return res.status(400).json({
				error: error
			})
		}
		if(member.photo.data){
			res.set('Content-Type',member.photo.data)
			return res.send(member.photo.data)
		}
	})
}