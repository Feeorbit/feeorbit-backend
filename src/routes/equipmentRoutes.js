const express = require('express');
const router = express.Router();
const {
  getEquipment,
  getGymDetails,
  askMachineCoachAI,
  generateMachineGuideAI,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} = require('../controllers/equipmentController');
const { protect } = require('../middleware/auth');

// Optional protect middleware so public showcase or demo can access or members with auth
router.get('/', getEquipment);
router.get('/gym-details', getGymDetails);
router.post('/ai-coach', askMachineCoachAI);
router.post('/ai-generate', generateMachineGuideAI);

router.post('/', createEquipment);
router.put('/:id', updateEquipment);
router.delete('/:id', deleteEquipment);

module.exports = router;
