import express from 'express';    
import { 
    getAllUsers,
    getMetrics,
    getAnalytics,
    getComplaints,
    sendBulkNotices,
    updateComplaintStatus,
    getAuditLogs,
    getGovUpdates,
    postGovUpdate,
    deleteGovUpdate,
    getAdminProfile,
    updateAdminProfile
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';   

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/users', getAllUsers);
router.get('/metrics', getMetrics);
router.get('/analytics', getAnalytics);
router.get('/complaints', getComplaints);
router.get('/audit-logs', getAuditLogs);
router.get('/gov-updates', getGovUpdates);
router.post('/gov-updates', postGovUpdate);
router.delete('/gov-updates/:id', deleteGovUpdate);
router.put('/complaints/:id/status', updateComplaintStatus);
router.post('/send-notices', sendBulkNotices);
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

export default router;
