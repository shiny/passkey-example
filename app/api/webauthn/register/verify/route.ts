import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import {
  addDevice,
  getOrigin,
  getRpID,
  getUser,
  setCurrentChallenge
} from '@/lib/webauthn';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = body?.username || 'demo';
    const response = body?.response;
    const host = request.headers.get('host') || undefined;

    const user = getUser(username);
    if (!user || !user.currentChallenge) {
      return NextResponse.json({ error: 'No registration in progress.' }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: getOrigin(host),
      expectedRPID: getRpID(host)
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      addDevice(username, {
        credentialID: registrationInfo.credentialID,
        credentialPublicKey: registrationInfo.credentialPublicKey,
        counter: registrationInfo.counter,
        transports: response.response.transports
      });
    }

    setCurrentChallenge(user.username, undefined);

    return NextResponse.json({ verified });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
