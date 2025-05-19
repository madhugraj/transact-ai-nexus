
import { InventoryItem } from "@/types/inventoryMapping";

/**
 * Parse inventory data from various file formats
 */
export const parseInventoryFile = async (file: File): Promise<InventoryItem[]> => {
  try {
    if (file.type === 'application/json') {
      return parseJsonFile(file);
    } else if (
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      // For demo purposes, we'll just parse CSV
      // In a real implementation, we would use libraries like xlsx for Excel files
      return parseCsvFile(file);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (error) {
    console.error("Error parsing inventory file:", error);
    throw error;
  }
};

/**
 * Parse JSON file to extract inventory items
 */
const parseJsonFile = async (file: File): Promise<InventoryItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Try to handle different JSON structures
        if (Array.isArray(json)) {
          // Direct array of items
          const items = json.map((item, index) => ({
            id: item.id || `item_${index}`,
            name: item.name || item.itemName || item.product_name || `Item ${index + 1}`,
            quantity: item.quantity || item.qty || item.amount || 0,
            unitPrice: item.unitPrice || item.price || item.unit_price || 0,
            description: item.description || item.desc || '',
            sku: item.sku || item.code || item.product_code || '',
            category: item.category || item.type || '',
            ...item // Include all other properties
          }));
          
          resolve(items);
        } else if (json.items || json.products || json.inventory) {
          // Object with items/products array
          const itemsArray = json.items || json.products || json.inventory;
          if (Array.isArray(itemsArray)) {
            const items = itemsArray.map((item, index) => ({
              id: item.id || `item_${index}`,
              name: item.name || item.itemName || item.product_name || `Item ${index + 1}`,
              quantity: item.quantity || item.qty || item.amount || 0,
              unitPrice: item.unitPrice || item.price || item.unit_price || 0,
              description: item.description || item.desc || '',
              sku: item.sku || item.code || item.product_code || '',
              category: item.category || item.type || '',
              ...item // Include all other properties
            }));
            
            resolve(items);
          } else {
            reject(new Error("Invalid JSON structure: items property is not an array"));
          }
        } else {
          reject(new Error("Invalid JSON structure: could not find inventory items"));
        }
      } catch (error) {
        reject(new Error("Failed to parse JSON file"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read JSON file"));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse CSV file to extract inventory items
 */
const parseCsvFile = async (file: File): Promise<InventoryItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        
        if (lines.length < 2) {
          reject(new Error("CSV file must have at least a header row and one data row"));
          return;
        }
        
        // Parse header row
        const headers = lines[0].split(',').map(header => 
          header.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
        );
        
        // Parse data rows
        const items: InventoryItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines
          
          const values = line.split(',').map(val => val.trim());
          if (values.length !== headers.length) {
            console.warn(`Skipping row ${i}: column count mismatch`);
            continue;
          }
          
          const item: Record<string, any> = {
            id: `item_${i}`
          };
          
          headers.forEach((header, index) => {
            item[header] = values[index];
            
            // Try to detect common inventory fields
            if (header.includes('name') || header.includes('item')) {
              item.name = values[index];
            } else if (header.includes('quantity') || header.includes('qty')) {
              item.quantity = values[index];
            } else if (header.includes('price') || header.includes('cost')) {
              item.unitPrice = values[index];
            } else if (header.includes('description') || header.includes('desc')) {
              item.description = values[index];
            } else if (header.includes('sku') || header.includes('code')) {
              item.sku = values[index];
            } else if (header.includes('category') || header.includes('type')) {
              item.category = values[index];
            }
          });
          
          // Ensure required fields are present
          if (!item.name) item.name = `Item ${i}`;
          if (!item.quantity) item.quantity = 0;
          if (!item.unitPrice) item.unitPrice = 0;
          
          items.push(item as InventoryItem);
        }
        
        resolve(items);
      } catch (error) {
        reject(new Error("Failed to parse CSV file"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read CSV file"));
    };
    
    reader.readAsText(file);
  });
};
