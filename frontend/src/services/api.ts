import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import QRCode from 'qrcode';

export const api = {
  // Auth
  auth: {
    register: async (body: any) => {
      try {
        if (!auth) {
          // Demo fallback
          const demoUser = {
            id: 'demo_new_user',
            name: body.ownerName,
            email: body.email,
            role: 'cafe_admin' as const,
            cafe: {
              id: 'demo_new_cafe',
              businessName: body.businessName,
              status: 'trial',
              subscription: {
                plan: 'free',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                maxTables: 10,
                maxMenuItems: 100,
              },
            },
          };
          return {
            success: true,
            token: 'demo_token_new',
            user: demoUser
          } as any;
        }
        if (!db) return { success: false, message: 'Database not initialized' };
        const userCredential = await createUserWithEmailAndPassword(auth, body.email, body.password);
        const user = userCredential.user;
        const token = await user.getIdToken();
        const userData = {
          id: user.uid,
          name: body.ownerName,
          email: body.email,
          role: 'cafe_admin' as const,
          cafe: {
            id: user.uid + '_cafe',
            businessName: body.businessName,
            status: 'trial',
            subscription: {
              plan: 'free',
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              maxTables: 10,
              maxMenuItems: 100,
            },
          },
        };
        await setDoc(doc(db, 'users', user.uid), userData);
        return { success: true, token, user: userData } as any;
      } catch (error: any) {
        console.error('Firebase Auth Register Error:', error);
        throw new Error(error.message || 'Registration failed');
      }
    },
    login: async (body: any) => {
      try {
        if (!auth) {
          // Demo fallback
          if (body.email === 'owner@thecoffeehouse.com' && body.password === 'Owner@123') {
            return {
              success: true,
              token: 'demo_token_admin',
              user: { id: 'demo_admin', email: body.email, role: 'cafe_admin', name: 'Demo Admin' }
            };
          }
          if (body.email === 'kitchen@thecoffeehouse.com' && body.password === 'Kitchen@123') {
            return {
              success: true,
              token: 'demo_token_kitchen',
              user: { id: 'demo_kitchen', email: body.email, role: 'kitchen_staff', name: 'Demo Kitchen' }
            };
          }
          if (body.email === 'admin@smartcafe.app' && body.password === 'Admin@123') {
            return {
              success: true,
              token: 'demo_token_superadmin',
              user: { id: 'demo_superadmin', email: body.email, role: 'super_admin', name: 'Demo Super Admin' }
            };
          }
          return { success: false, message: 'Auth not initialized' };
        }
        const userCredential = await signInWithEmailAndPassword(auth, body.email, body.password);
        const user = userCredential.user;
        const token = await user.getIdToken();
        if (!db) return { success: false, message: 'Database not initialized' };
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        let userData = docSnap.exists() ? docSnap.data() : { id: user.uid, email: user.email, role: 'cafe_admin' as const, name: 'Unknown' };
        return { success: true, token, user: userData as any } as any;
      } catch (error: any) {
        console.error('Firebase Auth Login Error:', error);
        throw new Error(error.message || 'Login failed');
      }
    },
    me: async (): Promise<any> => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated' };
      try {
        const user = auth.currentUser;
        if (!db) return { success: false, message: 'Database not initialized' };
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { success: true, user: docSnap.data() as any };
        }
        return { success: true, user: { id: user.uid, email: user.email, role: 'cafe_admin' as const, name: 'Unknown' } as any };
      } catch (error: any) {
        console.error('Firebase Auth Me Error:', error);
        return { success: false, message: error.message };
      }
    },
    updateProfile: async (body: any) => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated' };
      if (!db) return { success: false, message: 'Database not initialized' };
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, body);
      const updatedSnap = await getDoc(userRef);
      return { success: true, user: updatedSnap.data() };
    },
    changePassword: async (body: any) => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated' };
      try {
        await updatePassword(auth.currentUser, body.newPassword);
        return { success: true };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
    forgotPassword: async (body: any) => {
      try {
        if (!auth) return { success: false, message: 'Auth not initialized' };
        await sendPasswordResetEmail(auth, body.email);
        return { success: true };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
    resetPassword: async (_token: string, _body: any) => {
      // Firebase auth handles this through a redirect out-of-the-box, or a specialized flow.
      return { success: false, message: 'Not implemented in fully client-side mode.' };
    },
    addStaff: async (_body: any) => {
      // Typically needs admin SDK to create users without logging out. We will just mock or return error for now.
      return { success: false, message: 'Staff creation requires Admin SDK or separate flow.' };
    },
  },

  // Cafe Settings
  cafe: {
    getDetails: async () => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated' };
      if (!db) return { success: false, message: 'Database not initialized' };
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDoc.exists()) return { success: false };
      return { success: true, cafe: userDoc.data()?.cafe };
    },
    updateDetails: async (body: any) => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated' };
      if (!db) return { success: false, message: 'Database not initialized' };
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentCafe = userDoc.data()?.cafe || {};
      const updatedCafe = { ...currentCafe, ...body };
      await updateDoc(userRef, { cafe: updatedCafe });
      return { success: true, cafe: updatedCafe };
    },
    updateLogo: async (_body: FormData) => {
      // Mocking image upload. Real implementation needs Firebase Storage.
      return { success: true, logoUrl: '' };
    }
  },

  // Menu Categories & Items
  menu: {
    // Categories
    getCategories: async () => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated', categories: [] };
      if (!db) return { success: false, message: 'Database not initialized', categories: [] };
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const cafeId = userDoc.data()?.cafe?.id;
      if (!cafeId) return { success: false, message: 'No cafe ID', categories: [], items: [] };
      const q = query(collection(db, 'menuCategories'), where('cafeId', '==', cafeId));
      const snapshot = await getDocs(q);
      return { success: true, categories: snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as any)) };
    },
    createCategory: async (body: any) => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated' };
      if (!db) return { success: false, message: 'Database not initialized' };
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      const cafeId = userDoc.data()?.cafe?.id;
      if (!db) return { success: false, message: 'Database not initialized' };
      const ref = await addDoc(collection(db, 'menuCategories'), { ...body, cafeId });
      return { success: true, category: { _id: ref.id, ...body, cafeId } };
    },
    updateCategory: async (id: string, body: any) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      await updateDoc(doc(db, 'menuCategories', id), body);
      return { success: true, category: { _id: id, ...body } };
    },
    deleteCategory: async (id: string) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      await deleteDoc(doc(db, 'menuCategories', id));
      return { success: true };
    },

    // Items
    getItems: async () => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated', items: [] };
      if (!db) return { success: false, message: 'Database not initialized', items: [] };
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const cafeId = userDoc.data()?.cafe?.id;
      if (!cafeId) return { success: false, message: 'No cafe ID', categories: [], items: [] };
      const q = query(collection(db, 'menuItems'), where('cafeId', '==', cafeId));
      const snapshot = await getDocs(q);
      return { success: true, items: snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as any)) };
    },
    createItem: async (body: any) => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated' };
      if (!db) return { success: false, message: 'Database not initialized' };
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      const cafeId = userDoc.data()?.cafe?.id;
      if (!db) return { success: false, message: 'Database not initialized' };
      const ref = await addDoc(collection(db, 'menuItems'), { ...body, cafeId });
      return { success: true, item: { _id: ref.id, ...body, cafeId }, message: 'Created' };
    },
    updateItem: async (id: string, body: any) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      await updateDoc(doc(db, 'menuItems', id), body);
      return { success: true, item: { _id: id, ...body }, message: 'Updated' };
    },
    deleteItem: async (id: string) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      await deleteDoc(doc(db, 'menuItems', id));
      return { success: true };
    },
    uploadItemImage: async (_id: string, _formData: FormData) => {
      return { success: true, image: '' };
    }
  },

  // Tables
  tables: {
    list: async () => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated', tables: [] };
      if (!db) return { success: false, message: 'Database not initialized' };
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const cafeId = userDoc.data()?.cafe?.id;
      if (!cafeId) return { success: false, message: 'No cafe associated', tables: [] };

      if (!db) return { success: false, message: 'Database not initialized' };
      const tablesRef = collection(db, 'tables');
      const q = query(tablesRef, where('cafeId', '==', cafeId));
      const querySnapshot = await getDocs(q);
      const tables = querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as any));

      return { success: true, tables };
    },
    create: async (body: any) => {
      if (!auth) {
        // Demo fallback
        const tableToken = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        const newTable = {
          ...body,
          cafeId: 'demo_cafe',
          status: body.status || 'vacant',
          tableToken,
          _id: `demo_table_${Date.now()}`
        };
        return { success: true, table: newTable };
      }
      if (!auth.currentUser) return { success: false, message: 'Not authenticated' };
      if (!db) return { success: false, message: 'Database not initialized' };
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      const cafeId = userDoc.data()?.cafe?.id;
      if (!db) return { success: false, message: 'Database not initialized' };
      const tablesRef = collection(db, 'tables');

      const tableToken = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      const qrUrl = `${window.location.origin}/menu/${cafeId}/${tableToken}`;
      const qrCodeUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });

      const newTable = {
        ...body,
        cafeId,
        status: body.status || 'vacant',
        qrCodeUrl,
        tableToken
      };

      const docRef = await addDoc(tablesRef, newTable);
      return { success: true, table: { _id: docRef.id, ...newTable } };
    },
    bulkCreate: async (body: any) => {
      if (!auth) {
        // Demo fallback
        const { count, prefix = '', startFrom = 1 } = body;
        const newTables = [];
        for (let i = 0; i < count; i++) {
          const tableNumber = `${prefix}${startFrom + i}`;
          const tableToken = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
          newTables.push({
            _id: `demo_table_${Date.now()}_${i}`,
            tableNumber,
            displayName: `Table ${tableNumber}`,
            capacity: 4,
            location: 'Indoor',
            status: 'vacant' as const,
            cafeId: 'demo_cafe',
            tableToken
          });
        }
        return { success: true, message: `Created ${count} tables successfully`, tables: newTables };
      }
      if (!auth.currentUser) return { success: false, message: 'Not authenticated' };
      if (!db) return { success: false, message: 'Database not initialized' };
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      const cafeId = userDoc.data()?.cafe?.id;

      if (!db) return { success: false, message: 'Database not initialized' };
      const batch = writeBatch(db);
      const tablesRef = collection(db, 'tables');

      const { count, prefix = '', startFrom = 1 } = body;
      const newTables = [];

      for (let i = 0; i < count; i++) {
        const tableNumber = `${prefix}${startFrom + i}`;
        const newTableRef = doc(tablesRef);
        const tableToken = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        const qrUrl = `${window.location.origin}/menu/${cafeId}/${tableToken}`;
        const qrCodeUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });

        const newTable = {
          tableNumber,
          displayName: `Table ${tableNumber}`,
          capacity: 4,
          location: 'Indoor',
          status: 'vacant' as const,
          cafeId,
          qrCodeUrl,
          tableToken
        };
        batch.set(newTableRef, newTable);
        newTables.push({ _id: newTableRef.id, ...newTable });
      }

      await batch.commit();
      return { success: true, message: `Created ${count} tables successfully`, tables: newTables };
    },
    update: async (id: string, body: any) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      const tableRef = doc(db, 'tables', id);
      await updateDoc(tableRef, body);
      const updatedDoc = await getDoc(tableRef);
      return { success: true, table: { _id: updatedDoc.id, ...updatedDoc.data() } };
    },
    delete: async (id: string) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      await deleteDoc(doc(db, 'tables', id));
      return { success: true };
    },
    getQR: async (_id: string) => {
      return { success: true, qrDataUrl: '' }; // Fake QR Code return
    },
    regenerateQR: async (id: string) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      const tableRef = doc(db, 'tables', id);
      const tableDoc = await getDoc(tableRef);
      if (!tableDoc.exists()) return { success: false, message: 'Table not found' };
      const cafeId = tableDoc.data().cafeId;

      const newTableToken = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      const qrUrl = `${window.location.origin}/menu/${cafeId}/${newTableToken}`;
      const qrCodeUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });

      await updateDoc(tableRef, { tableToken: newTableToken, qrCodeUrl });
      return { success: true, qrDataUrl: qrCodeUrl };
    },
    downloadQRUrl: (_id: string) => ``, // No longer applicable without backend
  },

  // Orders
  orders: {
    list: async (params?: any) => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated', orders: [] };

      if (!db) return { success: false, message: 'Database not initialized', orders: [] };
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const cafeId = userDoc.data()?.cafe?.id;
      if (!cafeId) return { success: false, message: 'No cafe associated', orders: [] };

      if (!db) return { success: false, message: 'Database not initialized', orders: [] };
      const ordersRef = collection(db, 'orders');
      let q;
      if (params?.activeOnly === 'true') {
        q = query(ordersRef, where('cafeId', '==', cafeId), where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready', 'served']));
      } else {
        q = query(ordersRef, where('cafeId', '==', cafeId));
      }

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as any));
      return { success: true, orders };
    },
    getDetails: async (id: string) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      const docSnap = await getDoc(doc(db, 'orders', id));
      if (docSnap.exists()) {
        return { success: true, order: { _id: docSnap.id, ...docSnap.data() } as any };
      }
      return { success: false, message: 'Order not found' };
    },
    updateStatus: async (id: string, body: { status: string; estimatedTime?: number }) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      const orderRef = doc(db, 'orders', id);
      const updates: any = { status: body.status, updatedAt: new Date().toISOString() };
      if (body.estimatedTime !== undefined) updates.estimatedTime = body.estimatedTime;
      await updateDoc(orderRef, updates);
      return { success: true };
    },
    cancel: async (id: string, body: { reason: string }) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      const orderRef = doc(db, 'orders', id);
      await updateDoc(orderRef, { status: 'cancelled', cancelReason: body.reason, updatedAt: new Date().toISOString() });
      return { success: true };
    },
  },

  // Invoices & Billing
  invoices: {
    list: async (_params?: any) => {
      if (!auth || !auth.currentUser) return { success: false, message: 'Not authenticated', invoices: [] };
      if (!db) return { success: false, message: 'Database not initialized', invoices: [] };
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const cafeId = userDoc.data()?.cafe?.id;
      if (!cafeId) return { success: false, message: 'No cafe associated', invoices: [] };

      if (!db) return { success: false, message: 'Database not initialized', invoices: [] };
      const invoicesRef = collection(db, 'invoices');
      const q = query(invoicesRef, where('cafeId', '==', cafeId));
      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as any));

      return { success: true, invoices };
    },
    create: async (body: { orderId: string; paymentMethod: string; discount?: number }) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      const orderSnap = await getDoc(doc(db, 'orders', body.orderId));
      if (!orderSnap.exists()) throw new Error('Order not found');

      const order = orderSnap.data();
      const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      const invoiceData = {
        ...body,
        cafeId: order.cafeId,
        orderData: order,
        total: order.totalAmount,
        invoiceNumber,
        createdAt: new Date().toISOString()
      };

      if (!db) return { success: false, message: 'Database not initialized' };
      const invoicesRef = collection(db, 'invoices');
      const docRef = await addDoc(invoicesRef, invoiceData);

      if (!db) return { success: false, message: 'Database not initialized' };
      await updateDoc(doc(db, 'orders', body.orderId), { status: 'completed' });

      return { success: true, invoice: { _id: docRef.id, ...invoiceData } };
    },
    getPDFUrl: (_id: string) => ``,
    exportExcelUrl: () => ``,
  },

  // Analytics
  analytics: {
    getOverview: async (_period?: string) => {
      return { success: true, stats: { revenue: 0, orders: 0, avgOrderValue: 0 } };
    },
    getSalesTrend: async (_period?: string) => {
      return { success: true, trendData: [] };
    },
    getTopItems: async () => {
      return { success: true, topItems: [] };
    },
  },

  // Super Admin
  superAdmin: {
    getCafes: async () => ({ success: true, cafes: [] }),
    getAnalytics: async () => ({ success: true, stats: {} }),
    suspendCafe: async (_id: string) => ({ success: true }),
    activateCafe: async (_id: string) => ({ success: true }),
  },

  // Customer Public
  customer: {
    getMenu: async (cafeId: string, tableToken: string) => {
      if (!db) return { success: false, message: 'Database not initialized', categories: [], items: [] };
      const cafeQuery = query(collection(db, 'users'), where('cafe.id', '==', cafeId));
      const cafeSnap = await getDocs(cafeQuery);
      if (cafeSnap.empty) return { success: false, message: 'Cafe not found', categories: [], items: [] };

      const cafe = cafeSnap.docs[0].data().cafe;

      // Basic table validation (optional depending on strictness)
      if (!db) return { success: false, message: 'Database not initialized', categories: [], items: [] };
      const tablesRef = collection(db, 'tables');
      const tableQ = query(tablesRef, where('cafeId', '==', cafeId), where('tableToken', '==', tableToken));
      const tableSnap = await getDocs(tableQ);
      if (tableSnap.empty) return { success: false, message: 'Invalid table token', categories: [], items: [] };

      const categoriesSnap = await getDocs(query(collection(db, 'menuCategories'), where('cafeId', '==', cafeId)));
      const itemsSnap = await getDocs(query(collection(db, 'menuItems'), where('cafeId', '==', cafeId)));

      return {
        success: true,
        cafe,
        categories: categoriesSnap.docs.map(d => ({ _id: d.id, ...d.data() } as any)),
        items: itemsSnap.docs.map(d => ({ _id: d.id, ...d.data() } as any))
      };
    },
    placeOrder: async (body: {
      cafeId: string;
      tableToken: string;
      items: Array<{
        menuItemId: string;
        name: string;
        quantity: number;
        notes?: string;
        customizations?: any[];
      }>;
      customerName?: string;
      customerMobile?: string;
      specialInstructions?: string;
    }) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      const ordersRef = collection(db, 'orders');

      if (!db) return { success: false, message: 'Database not initialized' };
      const tablesRef = collection(db, 'tables');
      const q = query(tablesRef, where('cafeId', '==', body.cafeId), where('tableToken', '==', body.tableToken));
      const querySnapshot = await getDocs(q);

      let tableNumber = 'Unknown';
      if (!querySnapshot.empty) {
         tableNumber = querySnapshot.docs[0].data().tableNumber;
      }

      // Fetch prices from menu items
      if (!db) return { success: false, message: 'Database not initialized' };
      const menuItemsRef = collection(db, 'menuItems');
      let subtotal = 0;

      const formattedItems = await Promise.all(body.items.map(async (item) => {
        let price = 0;
        try {
          const itemDoc = await getDoc(doc(menuItemsRef, item.menuItemId));
          if (itemDoc.exists()) {
            price = itemDoc.data().price || 0;
          }
        } catch (err) {
          console.error("Error fetching menu item price", err);
        }

        const itemSubtotal = price * item.quantity;
        subtotal += itemSubtotal;
        return {
          ...item,
          price,
          subtotal: itemSubtotal
        };
      }));

      const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();

      const newOrder = {
        cafeId: body.cafeId,
        tableToken: body.tableToken,
        tableNumber,
        orderNumber,
        customerName: body.customerName || 'Guest',
        customerMobile: body.customerMobile || '',
        specialInstructions: body.specialInstructions || '',
        items: formattedItems,
        subtotal: subtotal,
        gstAmount: subtotal * 0.05,
        totalAmount: subtotal * 1.05,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(ordersRef, newOrder);
      return { success: true, orderId: docRef.id, order: { _id: docRef.id, ...newOrder } };
    },
    trackOrder: async (orderId: string) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      const docSnap = await getDoc(doc(db, 'orders', orderId));
      if (docSnap.exists()) {
        return { success: true, order: { _id: docSnap.id, ...docSnap.data() } as any };
      }
      return { success: false, message: 'Order not found' };
    },
    submitFeedback: async (body: {
      cafe: string;
      order?: string;
      customerName: string;
      rating: number;
      comment?: string;
    }) => {
      if (!db) return { success: false, message: 'Database not initialized' };
      const feedbackRef = collection(db, 'feedback');
      await addDoc(feedbackRef, {
        ...body,
        createdAt: new Date().toISOString()
      });
      return { success: true };
    },
  }
};
