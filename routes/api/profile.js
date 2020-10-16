const express = require('express');
const request = require('request');
const config = require('config');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

//@route    GET /api/profile/me
//@desc     get current user profile
//@access   private

router.get('/me', auth, (req, res) => {
  try {
    const profile = Profile.findOne({ user: req.user.id }).populate('user', [
      'name',
      'avatar',
    ]);
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(400).send('Server Error');
  }
});

//@route    POST /api/profile
//@desc     Create or update current user profile
//@access   private

router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').exists(),
      check('skills', 'Skills are required').exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      profile = new Profile(profileFields);

      profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
  }
);

//@route    GET /api/profile
//@desc     get all profiles
//@access   public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(400).send('Server error');
  }
});

//@route    GET /api/profile/user/:user_id
//@desc     get all profile by user id
//@access   public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }

    res.json(profile);
  } catch (err) {
    if (err.kind === 'ObjectId')
      return res.status(400).json({ msg: 'Profile not found' });
    console.error(err.message);
    res.status(400).send('Server error');
  }
});

//@route    DELETE /api/profile
//@desc     delete current user,profile and posts
//@access   private

router.delete('/', auth, async (req, res) => {
  try {
    await Profile.findOneAndDelete({ user: req.user.id });
    await User.findOneAndDelete({ _id: req.user.id });

    return res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(400).send('server error');
  }
});

//@route    PUT /api/profile/experience
//@desc     add experience
//@access   private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').exists(),
      check('company', 'Company is required').exists(),
      check('from', 'From date is required').exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(400).send('server error');
    }
  }
);

//@route    PUT /api/profile/experience/:exp_id
//@desc     delete experience
//@access   private

router.put('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    const removeIndex = profile.experience;
    profile.experience = profile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    );

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(400).send('server error');
  }
});

//@route    PUT /api/profile/education
//@desc     add education
//@access   private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').exists(),
      check('degree', 'Degree is required').exists(),
      check('fieldofstudy', 'Field of study is required').exists(),
      check('from', 'From date is required').exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(400).send('server error');
    }
  }
);

//@route    PUT /api/profile/education/:edu_id
//@desc     delete education
//@access   private

router.put('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    profile.education = profile.education.filter(
      (edu) => edu._id.toString() !== req.params.edu_id
    );

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(400).send('server error');
  }
});

//@route    GET /api/profile/github/:username
//@desc     get github repos
//@access   public

router.get('/github/:username', async (req, res) => {
  const options = {
    uri: encodeURI(
      `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'clientId'
      )}&client_secret=${config.get('clientSecret')}`
    ),
    method: 'GET',
    headers: { 'user-agent': 'node.js' },
  };

  request(options, (error, response, body) => {
    if (error) console.error(error);
    if (response.statusCode !== 200) {
      return res
        .status(404)
        .json({ msg: 'No github account for this username' });
    }

    res.json(JSON.parse(body));
  });
});

module.exports = router;
