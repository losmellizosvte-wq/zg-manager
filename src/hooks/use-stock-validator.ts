'use client';

import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/client-provider';

export function useStockValidator() {
  const { firestore } = useFirebase();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningData, setWarningData] = useState<{ quantity: number, description: string, executives: string } | null>(null);
  
  const validatePurchase = useCallback(async (providerName: string, items: { description: string, quantity: number }[]) => {
    if (!firestore || providerName.toLowerCase() !== 'red del sol' || items.length === 0) {
      return true; // OK to proceed
    }
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(firestore, 'stock_en_transito'),
        where('providerName', '==', 'Red del Sol'),
        where('date', '>=', Timestamp.fromDate(thirtyDaysAgo))
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const item of items) {
         for (const doc of querySnapshot.docs) {
           const data = doc.data();
           const transitoItems = data.items || [];
           for (const tItem of transitoItems) {
             if (tItem.description.toLowerCase().includes(item.description.toLowerCase()) || 
                 item.description.toLowerCase().includes(tItem.description.toLowerCase())) {
                 setWarningData({ 
                   quantity: tItem.quantity, 
                   description: tItem.description,
                   executives: "Valentina/Leandro/Ramiro"
                 });
                 setIsWarningOpen(true);
                 return false; // Blocks, expects user to handle modal
             }
           }
         }
      }
      return true;
    } catch (error) {
      console.error("Error validating stock", error);
      return true;
    }
  }, [firestore]);

  const confirmPurchase = () => {
    setIsWarningOpen(false);
    return true;
  };

  return { isWarningOpen, setIsWarningOpen, warningData, validatePurchase, confirmPurchase };
}
