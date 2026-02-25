/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class PaymentService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * @param stripeSignature The stripe webhook signature
     * @param requestBody The raw webhook payload
     * @returns any Success
     * @throws ApiError
     */
    public paymentStripeWebhook(
        stripeSignature: string,
        requestBody: any,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/payment/stripe_webhooks',
            headers: {
                'stripe-signature': stripeSignature,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Update Stripe Customer Emai
     * @param customerId
     * @param requestBody
     * @returns boolean Success
     * @throws ApiError
     */
    public paymentUpdateStripeCustomerEmail(
        customerId: string,
        requestBody?: {
            email?: string;
        },
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/payment/stripe/updateStripeCustomerEmail/{customerId}',
            path: {
                'customerId': customerId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @returns any Success
     * @throws ApiError
     */
    public paymentSuccess(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/payment/success',
        });
    }

    /**
     * @param code
     * @param userId
     * @returns any Success
     * @throws ApiError
     */
    public paymentCheckAppsumoCoupon(
        code?: string,
        userId?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/payment/appsumo/coupon-redeem',
            query: {
                'code': code,
                'userId': userId,
            },
        });
    }

    /**
     * Update SpreadSheet Entry
     * @param userId
     * @param requestBody
     * @returns boolean Success
     * @throws ApiError
     */
    public paymentUpdateAppsumoEntry(
        userId?: string,
        requestBody?: {
            email?: string;
        },
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/payment/appsumo/updateEntry',
            query: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Revoke an Appsumo Coupon as well as the user's premium status. Usage: curl -F 'csv=@coves.csv' http://localhost:8083/api/payment/appsumo/revoke
     * @param formData
     * @returns void
     * @throws ApiError
     */
    public paymentRevokeAppsumoCoupon(
        formData?: {
            csv?: Blob;
        },
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/payment/appsumo/revoke',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `<File too long | Too many parts | Too many files | Field name too long | Field value too long | Too many fields | Unexpected field>  [fieldName] Example: File too long file1`,
            },
        });
    }

}
