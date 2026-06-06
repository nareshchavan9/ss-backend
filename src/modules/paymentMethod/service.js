import { PayoutMethod, PaymentCard } from './model.js';
import ApiError from '../../utils/ApiError.js';

class PaymentMethodService {
  /**
   * Add a new payout method for a host
   */
  async addPayoutMethod(data, hostId) {
    const existing = await PayoutMethod.find({ owner: hostId });
    
    // If it's the first payout method, make it primary/default
    const isDefault = existing.length === 0 ? true : !!data.isDefault;

    if (isDefault) {
      // Unset other defaults
      await PayoutMethod.updateMany({ owner: hostId }, { isDefault: false });
    }

    const payoutMethod = await PayoutMethod.create({
      ...data,
      owner: hostId,
      isDefault,
    });

    return payoutMethod;
  }

  /**
   * Get all payout methods for a host
   */
  async getPayoutMethods(hostId) {
    return await PayoutMethod.find({ owner: hostId }).sort({ createdAt: -1 });
  }

  /**
   * Remove a payout method
   */
  async deletePayoutMethod(id, hostId) {
    const method = await PayoutMethod.findOne({ _id: id, owner: hostId });
    if (!method) {
      throw new ApiError(404, 'Payout method not found');
    }

    await PayoutMethod.deleteOne({ _id: id });
    
    // If we deleted the default one, make the next default
    if (method.isDefault) {
      const remaining = await PayoutMethod.findOne({ owner: hostId }).sort({ createdAt: -1 });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    return method;
  }

  /**
   * Add a new credit/debit card for a traveler
   */
  async addPaymentCard(data, travelerId) {
    const card = await PaymentCard.create({
      ...data,
      user: travelerId,
    });
    return card;
  }

  /**
   * Get all registered cards for a traveler
   */
  async getPaymentCards(travelerId) {
    return await PaymentCard.find({ user: travelerId }).sort({ createdAt: -1 });
  }

  /**
   * Remove a registered card
   */
  async deletePaymentCard(id, travelerId) {
    const card = await PaymentCard.findOne({ _id: id, user: travelerId });
    if (!card) {
      throw new ApiError(404, 'Payment card not found');
    }
    await PaymentCard.deleteOne({ _id: id });
    return card;
  }
}

export default new PaymentMethodService();
