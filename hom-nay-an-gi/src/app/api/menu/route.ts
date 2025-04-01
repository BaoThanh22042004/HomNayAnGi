import { mapToMenuInfos, RawDishType } from "@/entities/menu";
import { Eatery } from "@/entities/eatery";
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

// Tạo hàm helper để tạo response JSON
const createJsonResponse = <T>(data: T) => {
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store"
    },
  });
};

// Kiểm tra path an toàn để ngăn Path Traversal Attack
const isValidPath = (filePath: string): boolean => {
  const normalizedPath = path.normalize(filePath);
  return !normalizedPath.includes('..');
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const data_path = searchParams.get("data_path");
    
    // Nếu không có data_path, trả về menu.json mặc định
    if (!data_path) {
      const filePath = path.join(process.cwd(), "src", "data", "menu.json");
      const jsonData = fs.readFileSync(filePath, { encoding: "utf8" });
      const data = JSON.parse(jsonData).eateries as Eatery[];
      return createJsonResponse(data);
    }
    
    // Kiểm tra path an toàn
    if (!isValidPath(data_path)) {
      return new Response("Invalid path", { 
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Surrogate-Control": "no-store"
        }
      });
    }
    
    const filePath = path.join(process.cwd(), "src", "data", data_path+".json");
    const jsonData = fs.readFileSync(filePath, { encoding: "utf8" });
    const parsedData = JSON.parse(jsonData);
    
    if (!parsedData.menu_infos) {
      return new Response("Invalid menu data format", { 
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Surrogate-Control": "no-store"
        }
      });
    }
    
    const data = parsedData.menu_infos as RawDishType[];
    const menuInfos = mapToMenuInfos(data);
    return createJsonResponse(menuInfos);
  } catch (error) {
    console.error("Error processing menu request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load menu data" }), 
      { 
        status: 500, 
        headers: { 
          "content-type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Surrogate-Control": "no-store"
        } 
      }
    );
  }
}