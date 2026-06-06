'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    company_name: 'VendorBridge Inc.',
    company_email: 'contact@vendorbridge.com',
    company_phone: '+91 80-1234-5678',
    company_address: '123 Business Park, Electronic City',
    company_city: 'Bangalore',
    company_state: 'Karnataka',
    company_gst: '29AADCB2230M1ZX',
    default_tax_rate: '18',
    default_payment_terms: '30',
    currency: 'INR',
    date_format: 'DD/MM/YYYY',
    invoice_prefix: 'INV',
    po_prefix: 'PO',
    rfq_prefix: 'RFQ',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_from: 'noreply@vendorbridge.com',
    enable_email_notifications: true,
    enable_auto_po: false,
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, this would call PUT /api/settings
      await new Promise(r => setTimeout(r, 800));
      toast.success('Settings saved successfully');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: 'company', label: '🏢 Company', icon: '🏢' },
    { id: 'procurement', label: '📋 Procurement', icon: '📋' },
    { id: 'email', label: '📧 Email', icon: '📧' },
    { id: 'preferences', label: '⚙️ Preferences', icon: '⚙️' },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure your VendorBridge instance</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="card">
          <div className="card-header"><h3>Company Information</h3></div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" value={settings.company_name} onChange={e => handleChange('company_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Company Email</label>
              <input className="form-input" type="email" value={settings.company_email} onChange={e => handleChange('company_email', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={settings.company_phone} onChange={e => handleChange('company_phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input className="form-input" value={settings.company_gst} onChange={e => handleChange('company_gst', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={settings.company_address} onChange={e => handleChange('company_address', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={settings.company_city} onChange={e => handleChange('company_city', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input className="form-input" value={settings.company_state} onChange={e => handleChange('company_state', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Procurement Tab */}
      {activeTab === 'procurement' && (
        <div className="card">
          <div className="card-header"><h3>Procurement Configuration</h3></div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Default Tax Rate (%)</label>
              <input className="form-input" type="number" value={settings.default_tax_rate} onChange={e => handleChange('default_tax_rate', e.target.value)} />
              <div className="form-hint">Applied to new purchase orders & invoices</div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Terms (days)</label>
              <input className="form-input" type="number" value={settings.default_payment_terms} onChange={e => handleChange('default_payment_terms', e.target.value)} />
              <div className="form-hint">Default invoice due period</div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={settings.currency} onChange={e => handleChange('currency', e.target.value)}>
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
                <option value="EUR">€ EUR — Euro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date Format</label>
              <select className="form-select" value={settings.date_format} onChange={e => handleChange('date_format', e.target.value)}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '12px' }}>
            <h4 style={{ marginBottom: '16px' }}>Document Number Prefixes</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">RFQ Prefix</label>
                <input className="form-input" value={settings.rfq_prefix} onChange={e => handleChange('rfq_prefix', e.target.value)} />
                <div className="form-hint">e.g., RFQ-2026-00001</div>
              </div>
              <div className="form-group">
                <label className="form-label">PO Prefix</label>
                <input className="form-input" value={settings.po_prefix} onChange={e => handleChange('po_prefix', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Invoice Prefix</label>
                <input className="form-input" value={settings.invoice_prefix} onChange={e => handleChange('invoice_prefix', e.target.value)} />
              </div>
              <div className="form-group" />
            </div>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div className="card">
          <div className="card-header"><h3>Email (SMTP) Configuration</h3></div>
          <div style={{ padding: '12px 16px', background: 'var(--info-50)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--info-600)' }}>
            ℹ️ Configure SMTP to enable email sending for invoices and notifications. For Gmail, use an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>App Password</a>.
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SMTP Host</label>
              <input className="form-input" placeholder="smtp.gmail.com" value={settings.smtp_host} onChange={e => handleChange('smtp_host', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Port</label>
              <input className="form-input" type="number" value={settings.smtp_port} onChange={e => handleChange('smtp_port', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SMTP Username</label>
              <input className="form-input" placeholder="your-email@gmail.com" value={settings.smtp_user} onChange={e => handleChange('smtp_user', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">From Address</label>
              <input className="form-input" value={settings.smtp_from} onChange={e => handleChange('smtp_from', e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <input type="checkbox" id="enableEmail" checked={settings.enable_email_notifications} onChange={e => handleChange('enable_email_notifications', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--primary-600)' }} />
            <label htmlFor="enableEmail" style={{ fontWeight: 500, cursor: 'pointer' }}>Enable email notifications for procurement updates</label>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="card">
          <div className="card-header"><h3>Application Preferences</h3></div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input type="checkbox" id="autoPo" checked={settings.enable_auto_po} onChange={e => handleChange('enable_auto_po', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--primary-600)' }} />
            <div>
              <label htmlFor="autoPo" style={{ fontWeight: 600, cursor: 'pointer', display: 'block' }}>Auto-generate Purchase Orders</label>
              <span className="text-xs text-muted">Automatically create POs when a quotation is approved</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '20px' }}>
            <h4 style={{ marginBottom: '12px', color: 'var(--error-600)' }}>⚠️ Danger Zone</h4>
            <p className="text-sm text-muted" style={{ marginBottom: '12px' }}>Irreversible actions. Proceed with caution.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ borderColor: 'var(--error-500)', color: 'var(--error-600)' }} onClick={() => toast.info('This feature is not yet available')}>Reset All Settings</button>
              <button className="btn btn-outline" style={{ borderColor: 'var(--error-500)', color: 'var(--error-600)' }} onClick={() => toast.info('This feature is not yet available')}>Clear Activity Logs</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
