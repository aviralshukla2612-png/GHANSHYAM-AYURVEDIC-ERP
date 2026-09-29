import { Injectable, Logger } from '@nestjs/common';

export interface ProductionSecrets {
  gspClientId: string;
  gspClientSecret: string;
  gspUsername: string;
  gspPassword?: string;
  encryptionKey: string;
  jwtSecret: string;
  databaseUrl: string;
}

@Injectable()
export class ProductionSecretService {
  private readonly logger = new Logger(ProductionSecretService.name);

  // Retrieve sanitized configuration without leaking secrets to logs
  getSecrets(): ProductionSecrets {
    const secrets: ProductionSecrets = {
      gspClientId: process.env.GSP_CLIENT_ID || 'PROD_GSP_CLIENT_GAP_88',
      gspClientSecret: process.env.GSP_CLIENT_SECRET || 'sec_prod_9938472910384729',
      gspUsername: process.env.GSP_USERNAME || 'ghanshyam_prod_user',
      gspPassword: process.env.GSP_PASSWORD || 'prod_pass_encrypted',
      encryptionKey: process.env.ENCRYPTION_KEY || '32_char_aes_256_encryption_key_sec',
      jwtSecret: process.env.JWT_SECRET || 'ghanshyam_erp_jwt_secret_key_2026',
      databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
    };

    return secrets;
  }

  // Mask sensitive secret values for safe logging
  maskSecret(val?: string): string {
    if (!val || val.length <= 4) return '****';
    return `${val.slice(0, 2)}****${val.slice(-2)}`;
  }

  // Log configuration state safely without exposing passwords or keys
  logSanitizedConfig() {
    const s = this.getSecrets();
    this.logger.log(
      JSON.stringify({
        gspClientId: s.gspClientId,
        gspClientSecret: this.maskSecret(s.gspClientSecret),
        gspUsername: s.gspUsername,
        jwtSecret: this.maskSecret(s.jwtSecret),
        encryptionKey: this.maskSecret(s.encryptionKey),
        databaseUrl: s.databaseUrl.split('@').pop(), // Remove DB credentials if present
      })
    );
  }

  // Verify that secrets are non-empty and meet minimal security length
  validateSecrets(): { isSecure: boolean; issues: string[] } {
    const s = this.getSecrets();
    const issues: string[] = [];

    if (!s.gspClientId) issues.push('GSP_CLIENT_ID is missing.');
    if (!s.gspClientSecret || s.gspClientSecret.length < 8) issues.push('GSP_CLIENT_SECRET must be at least 8 characters.');
    if (!s.jwtSecret || s.jwtSecret.length < 16) issues.push('JWT_SECRET must be at least 16 characters.');
    if (!s.encryptionKey || s.encryptionKey.length < 16) issues.push('ENCRYPTION_KEY must be at least 16 characters.');

    return {
      isSecure: issues.length === 0,
      issues,
    };
  }
}
