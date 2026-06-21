import { describe, it, expect } from 'vitest';

// 1. Sandbox Token Forwarding Generator Helper
function appendSandboxToken(demoUrl: string, itemId: string, visitorHash: string): string {
  const token = btoa(itemId + '-' + visitorHash).substring(0, 16);
  const separator = demoUrl.includes('?') ? '&' : '?';
  return `${demoUrl}${separator}sandbox_token=${token}`;
}

// 2. Outbound redirection proxy tracker query param helper
function buildRedirectionUrl(targetUrl: string, attributionRef: string = 'portfolio-platform'): string {
  const urlObj = new URL(targetUrl);
  urlObj.searchParams.set('ref', attributionRef);
  return urlObj.toString();
}

// 3. Upvote fraud checker logic helper
interface VotePayload {
  reviewerHash: string;
  visitorHash: string;
}
function validateVote(payload: VotePayload): { allowed: boolean; error?: string } {
  if (payload.reviewerHash === payload.visitorHash) {
    return { allowed: false, error: 'Self-voting is not allowed to prevent payout fraud.' };
  }
  return { allowed: true };
}

describe('B2B Core User Activities & Functionalities', () => {
  describe('Staging Sandbox Token Injection', () => {
    it('should append sandbox_token correctly to urls without query params', () => {
      const demoUrl = 'https://my-app.vercel.app';
      const itemId = 'item-123';
      const visitorHash = 'visitor-abc';
      const result = appendSandboxToken(demoUrl, itemId, visitorHash);
      
      expect(result).toContain('sandbox_token=');
      expect(result).toContain('?');
      expect(result).not.toContain('&&');
    });

    it('should append sandbox_token correctly to urls with existing query params', () => {
      const demoUrl = 'https://my-app.vercel.app/test?mode=edit';
      const itemId = 'item-123';
      const visitorHash = 'visitor-abc';
      const result = appendSandboxToken(demoUrl, itemId, visitorHash);
      
      expect(result).toContain('mode=edit');
      expect(result).toContain('&sandbox_token=');
    });
  });

  describe('Outbound Click Tracking Attribution', () => {
    it('should inject ref parameter to outbound destination links', () => {
      const target = 'https://github.com/creator/repo';
      const redirected = buildRedirectionUrl(target);
      
      expect(redirected).toContain('ref=portfolio-platform');
    });
  });

  describe('Upvote Fraud Validation Rules', () => {
    it('should reject votes when visitor matches the review creator (self-voting)', () => {
      const payload: VotePayload = {
        reviewerHash: 'user-hash-123',
        visitorHash: 'user-hash-123'
      };
      const check = validateVote(payload);
      expect(check.allowed).toBe(false);
      expect(check.error).toContain('Self-voting');
    });

    it('should accept votes when visitor is different from the reviewer', () => {
      const payload: VotePayload = {
        reviewerHash: 'reviewer-hash-abc',
        visitorHash: 'voter-hash-xyz'
      };
      const check = validateVote(payload);
      expect(check.allowed).toBe(true);
    });
  });
});
