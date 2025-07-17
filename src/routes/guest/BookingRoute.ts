import BookingController from '@/controllers/guest/BookingController'
// import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'


const router = Router()

// router.use(AuthMiddleware)

router.get('/', BookingController.getAllBookings)
router.post('/create', BookingController.createBooking)
router.delete('/soft-delete/:id', BookingController.softdeleteBooking)
router.patch('/restore/:id', BookingController.restoreBooking)
router.get('/:id', BookingController.getBookingById)
router.put('/konfirmasi/:id', BookingController.updateKonfirmasi)


export default router
