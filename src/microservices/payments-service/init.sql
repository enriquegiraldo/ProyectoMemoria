--src/microservices/payments-service/init.sql
-- Payments Service Database Initialization

-- Create enum types
CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'
);

CREATE TYPE payment_method AS ENUM (
  'card', 'bank_transfer', 'paypal', 'crypto', 'cash'
);

CREATE TYPE payment_provider AS ENUM (
  'stripe', 'paypal', 'mercadopago', 'crypto'
);

CREATE TYPE subscription_status AS ENUM (
  'active', 'canceled', 'past_due', 'unpaid', 'trialing'
);

CREATE TYPE currency AS ENUM (
  'USD', 'EUR', 'GBP', 'MXN', 'ARS', 'BRL', 'CLP', 'COP', 'PEN'
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID,
  subscription_id UUID,
  invoice_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  currency currency NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL,
  provider payment_provider NOT NULL,
  provider_payment_id VARCHAR(255),
  provider_customer_id VARCHAR(255),
  provider_payment_method_id VARCHAR(255),
  description TEXT,
  metadata JSONB,
  provider_data JSONB,
  failure_reason VARCHAR(255),
  failure_code VARCHAR(255),
  processed_at TIMESTAMP,
  failed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refunded_amount DECIMAL(10,2) DEFAULT 0,
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  customer_id UUID,
  status subscription_status NOT NULL DEFAULT 'active',
  provider payment_provider NOT NULL,
  provider_subscription_id VARCHAR(255),
  provider_customer_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency currency NOT NULL DEFAULT 'USD',
  interval VARCHAR(20) NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  quantity INTEGER DEFAULT 1,
  metadata JSONB,
  provider_data JSONB,
  cancel_reason VARCHAR(255),
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(255),
  provider payment_provider NOT NULL,
  provider_customer_id VARCHAR(255),
  address JSONB,
  metadata JSONB,
  provider_data JSONB,
  is_test BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_provider_payment_id ON payments(provider, provider_payment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_provider_subscription_id ON subscriptions(provider, provider_subscription_id);
CREATE INDEX idx_subscriptions_current_period_start ON subscriptions(current_period_start);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_provider_customer_id ON customers(provider, provider_customer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
