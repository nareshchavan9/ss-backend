import PaymentMethodService from './service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class PaymentMethodController {
  addPayout = asyncHandler(async (req, res) => {
    const payout = await PaymentMethodService.addPayoutMethod(req.body, req.user._id);
    return res
      .status(201)
      .json(new ApiResponse(201, payout, 'Payout method added successfully'));
  });

  listPayouts = asyncHandler(async (req, res) => {
    const payouts = await PaymentMethodService.getPayoutMethods(req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, payouts, 'Payout methods retrieved successfully'));
  });

  deletePayout = asyncHandler(async (req, res) => {
    const payout = await PaymentMethodService.deletePayoutMethod(req.params.id, req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, payout, 'Payout method removed successfully'));
  });

  addCard = asyncHandler(async (req, res) => {
    const card = await PaymentMethodService.addPaymentCard(req.body, req.user._id);
    return res
      .status(201)
      .json(new ApiResponse(201, card, 'Payment card added successfully'));
  });

  listCards = asyncHandler(async (req, res) => {
    const cards = await PaymentMethodService.getPaymentCards(req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, cards, 'Payment cards retrieved successfully'));
  });

  deleteCard = asyncHandler(async (req, res) => {
    const card = await PaymentMethodService.deletePaymentCard(req.params.id, req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, card, 'Payment card removed successfully'));
  });
}

export default new PaymentMethodController();
