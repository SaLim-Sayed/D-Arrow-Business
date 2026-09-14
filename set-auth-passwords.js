import fs from 'fs';
import path from 'path';
import os from 'os';
import admin from 'firebase-admin';

const projectId = "d-arrow-buisiness";
const configPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

let accessToken = config.tokens.access_token;
const refreshToken = config.tokens.refresh_token;

async function getValidToken() {
  if (config.tokens.expires_at && Date.now() > config.tokens.expires_at - 60000) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    const data = await res.json();
    if (data.access_token) accessToken = data.access_token;
  }
  return accessToken;
}

const usersMap = [
  { localId: "7uOOWWbFQ4e5rv966xxJjPbWHpu2", email: "salemsayed981@gmail.com" },
  { localId: "FYJypuZK5bSRvN72OIpLe19xa2a2", email: "admin@darrow.co" },
  { localId: "FTmvLB3V9Fdi4hbYHigS2Naz7c83", email: "salem@darrow.co" },
  { localId: "Ob1pdpjkXsT9UACi6FJRVBc8Zju1", email: "salem.test@darrow.co" },
  { localId: "dms55RAq1NZIL6TD74RhXVPCCNk1", email: "omar@darrow.co" },
  { localId: "g8RY7K5NXbRMnOskE04ZeoRhc392", email: "sara@darrow.com" },
  { localId: "6W4Cg8oPXmRFKq908fXTFcgySQA2", email: "laila.ya.2022@gmail.com" },
  { localId: "BGIy5U8yPKaM9hzDy2Foz88iyDw2", email: "samtom850@gmail.com" },
  { localId: "KdMI5ec72jNNo6Q2J8E2zNM32i62", email: "marwahesham368@gmail.com" },
  { localId: "LBddwLBaIBav8m4g8MXWhD1KEW73", email: "ahmed.eltnahy93@gmail.com" },
  { localId: "MUMYVAIR5nNt2WKAF8hbEw37Hf72", email: "bosyweb@gmail.com" },
  { localId: "fDi9J8cu6LYaeQHuE9Cibl96rWK2", email: "audy9pp41@gmail.com" },
  { localId: "fpNl69BOlpUWZobBRCTbNYTHRMU2", email: "z.ahraa22@icloud.com" },
  { localId: "jhi5PjERQSfxIWsp2474BEpOjwt2", email: "toome.saleh199@gmail.com" },
  { localId: "jrjisigUadOyd2Z2veGUSK5T38S2", email: "khulodahmed390@gmail.com" },
  { localId: "lC5SzsuorAbRCEs5XGtmaEcfOIn2", email: "ali.alshaqab@gmail.com" },
  { localId: "lLaUVGMvKOac46TeYFBqseQAgsi2", email: "meso20b@gmail.com" },
  { localId: "oMjxwPSSqIaDxDBiqevZrqflIGO2", email: "salim@darrow.co" }
];

const defaultPassword = "Password123!";

async function run() {
  const token = await getValidToken();

  admin.initializeApp({
    credential: {
      getAccessToken: async () => ({
        access_token: token,
        expires_in: 3600
      })
    },
    projectId
  });

  console.log(`Setting password '${defaultPassword}' via Firebase Admin SDK...`);

  for (const item of usersMap) {
    try {
      await admin.auth().updateUser(item.localId, {
        password: defaultPassword,
        emailVerified: true
      });
      console.log(`✓ Password set for ${item.email} (${item.localId})`);
    } catch (err) {
      console.error(`✗ Error setting password for ${item.email}:`, err.message);
    }
  }

  console.log('\nDone.');
}

run().catch(console.error);
