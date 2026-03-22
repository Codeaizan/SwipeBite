import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'swipebite-rules-test';

describe('Firestore security rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  it('blocks a student from creating their own user doc with elevated role', async () => {
    const studentDb = testEnv.authenticatedContext('student1').firestore();

    await assertFails(
      setDoc(doc(studentDb, 'users', 'student1'), {
        role: 'superAdmin',
        email: 'student1@example.com',
      })
    );
  });

  it('blocks a student from elevating role via update on own user doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'student1'), {
        role: 'student',
        email: 'student1@example.com',
      });
    });

    const studentDb = testEnv.authenticatedContext('student1').firestore();
    await assertFails(updateDoc(doc(studentDb, 'users', 'student1'), { role: 'superAdmin' }));
  });

  it('allows a student to create only their own swipe', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'student1'), {
        role: 'student',
        email: 'student1@example.com',
      });
    });

    const studentDb = testEnv.authenticatedContext('student1').firestore();

    await assertSucceeds(
      setDoc(doc(studentDb, 'swipes', 'swipe1'), {
        userId: 'student1',
        itemId: 'item1',
        direction: 'right',
      })
    );

    await assertFails(
      setDoc(doc(studentDb, 'swipes', 'swipe2'), {
        userId: 'another-user',
        itemId: 'item1',
        direction: 'left',
      })
    );
  });

  it('prevents students from updating existing swipes', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'student1'), {
        role: 'student',
        email: 'student1@example.com',
      });
      await setDoc(doc(ctx.firestore(), 'swipes', 'swipe1'), {
        userId: 'student1',
        itemId: 'item1',
        direction: 'right',
      });
    });

    const studentDb = testEnv.authenticatedContext('student1').firestore();
    await assertFails(updateDoc(doc(studentDb, 'swipes', 'swipe1'), { direction: 'left' }));
  });

  it('allows kiosk owner to update own kiosk item availability', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'owner1'), {
        role: 'kioskOwner',
        kioskName: 'Kiosk A',
        email: 'owner1@example.com',
      });
      await setDoc(doc(ctx.firestore(), 'items', 'item1'), {
        kiosk: 'Kiosk A',
        name: 'Burger',
        isAvailable: true,
      });
    });

    const ownerDb = testEnv.authenticatedContext('owner1').firestore();
    await assertSucceeds(updateDoc(doc(ownerDb, 'items', 'item1'), { isAvailable: false }));
  });

  it('blocks kiosk owner from changing another kiosk item', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'owner1'), {
        role: 'kioskOwner',
        kioskName: 'Kiosk A',
        email: 'owner1@example.com',
      });
      await setDoc(doc(ctx.firestore(), 'items', 'item2'), {
        kiosk: 'Kiosk B',
        name: 'Pizza',
        isAvailable: true,
      });
    });

    const ownerDb = testEnv.authenticatedContext('owner1').firestore();
    await assertFails(updateDoc(doc(ownerDb, 'items', 'item2'), { isAvailable: false }));
  });

  it('blocks kiosk owner from taking over another kiosk item by changing kiosk field', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'owner1'), {
        role: 'kioskOwner',
        kioskName: 'Kiosk A',
        email: 'owner1@example.com',
      });
      await setDoc(doc(ctx.firestore(), 'items', 'item2'), {
        kiosk: 'Kiosk B',
        name: 'Pizza',
        isAvailable: true,
      });
    });

    const ownerDb = testEnv.authenticatedContext('owner1').firestore();
    await assertFails(updateDoc(doc(ownerDb, 'items', 'item2'), { kiosk: 'Kiosk A' }));
  });

  it('allows super admin to create kiosks', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'admin1'), {
        role: 'superAdmin',
        email: 'admin1@example.com',
      });
    });

    const adminDb = testEnv.authenticatedContext('admin1').firestore();
    await assertSucceeds(
      setDoc(doc(adminDb, 'kiosks', 'kiosk-c'), {
        name: 'Kiosk C',
        location: 'Food Court',
      })
    );
  });

  it('blocks anonymous user from reading items', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'items', 'item-anon'), {
        kiosk: 'Kiosk A',
        name: 'Pasta',
        isAvailable: true,
      });
    });

    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anonDb, 'items', 'item-anon')));
  });

  it('supports expected query-shape fields for indexed reads', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'swipes', 'shape1'), {
        userId: 'student1',
        itemId: 'item1',
        direction: 'right',
        timestamp: new Date().toISOString(),
      });
    });

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const snap = await getDoc(doc(ctx.firestore(), 'swipes', 'shape1'));
      expect(snap.exists()).toBe(true);
      const data = snap.data();
      expect(data?.userId).toBeTypeOf('string');
      expect(data?.itemId).toBeTypeOf('string');
      expect(data?.direction).toBeTypeOf('string');
      expect(data?.timestamp).toBeDefined();
    });
  });
});
