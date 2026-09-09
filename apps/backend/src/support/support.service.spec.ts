import { normalizeSupportRequest } from './support.service';

describe('Support service normalization', () => {
  it('normalizes launch support payloads and keeps the original issue subject in metadata', () => {
    const result = normalizeSupportRequest({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'I paid but my subscription is stuck.',
      source: 'help-contact-page',
      type: 'REPORT_ISSUE',
      metadata: { subject: 'Report Issue', channel: 'web' },
    });

    expect(result.email).toBe('jane@example.com');
    expect(result.source).toBe('help-contact-page');
    expect(result.type).toBe('REPORT_ISSUE');
    expect(result.metadata).toMatchObject({
      subject: 'Report Issue',
      channel: 'web',
    });
  });

  it('falls back to a safe general ticket type when no explicit type is supplied', () => {
    const result = normalizeSupportRequest({
      email: 'customer@example.com',
      message: 'Need help resetting my password',
      metadata: { subject: 'Password reset' },
    });

    expect(result.type).toBe('GENERAL');
    expect(result.metadata.subject).toBe('Password reset');
  });
});
