import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button  from '../ui/Button';
import { Webhook, Plus, Trash2, Activity } from 'lucide-react';

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  secretPreview: string;
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
}

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks');
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Webhook className="w-6 h-6" />
            Webhooks
          </h2>
          <p className="text-gray-600 mt-1">
            Manage webhooks for real-time notifications
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Webhook
        </Button>
      </div>

      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Webhook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No webhooks found</p>
            <p className="text-sm">Create your first webhook to get started</p>
          </div>
        ) : (
          webhooks.map(webhook => (
            <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{webhook.url}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      webhook.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <code className="bg-gray-100 px-2 py-1 rounded">{webhook.secretPreview}</code>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {webhook.events.map(event => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {event}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {webhook.lastTriggered && (
                      <span className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        Last triggered: {formatDate(webhook.lastTriggered)}
                      </span>
                    )}
                    <span>Created: {formatDate(webhook.createdAt)}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
