import { PaymentProvider } from '../types';
import { StripeProvider } from './stripe.provider';
import { PayPalProvider } from './paypal.provider';
import { MercadoPagoProvider } from './mercadopago.provider';
import { CryptoProvider } from './crypto.provider';

export class PaymentProviderFactory {
  private static providers: Map<string, PaymentProvider> = new Map();

  static createProvider(providerName: string): PaymentProvider {
    const normalizedName = providerName.toLowerCase();
    
    if (this.providers.has(normalizedName)) {
      return this.providers.get(normalizedName)!;
    }

    let provider: PaymentProvider;

    switch (normalizedName) {
      case 'stripe':
        provider = new StripeProvider();
        break;
      case 'paypal':
        provider = new PayPalProvider();
        break;
      case 'mercadopago':
        provider = new MercadoPagoProvider();
        break;
      case 'crypto':
        provider = new CryptoProvider();
        break;
      default:
        throw new Error(`Unsupported payment provider: ${providerName}`);
    }

    this.providers.set(normalizedName, provider);
    return provider;
  }

  static getSupportedProviders(): string[] {
    return ['stripe', 'paypal', 'mercadopago', 'crypto'];
  }

  static getProvider(providerName: string): PaymentProvider | undefined {
    return this.providers.get(providerName.toLowerCase());
  }

  static clearProviders(): void {
    this.providers.clear();
  }
}
