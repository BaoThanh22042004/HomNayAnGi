import { NextRequest, NextResponse } from "next/server";
import { dishSelectionStore } from "@/lib/dishSelectionStore";
import { getEateryMenu } from "@/lib/api";
import { initializeDb } from "@/lib/db";
import { broadcastSelectionUpdate } from "@/lib/eventService";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Initialize database on first API call
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initializeDb();
    initialized = true;
  }
}

// GET - Retrieve all selections
export async function GET() {
  try {
    await ensureInitialized();
    const selections = await dishSelectionStore.getAllSelections();
    return NextResponse.json(selections, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error("Error getting selections:", error);
    return NextResponse.json(
      { error: "Failed to load selections" },
      { status: 500 }
    );
  }
}

// POST - Add a new selection
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const { dataPath, dishId, clientName, selectedOptions = [], quantity = 1, note = "" } = body;

    if (!dataPath || !dishId || !clientName) {
      return NextResponse.json(
        { error: "Missing required fields: dataPath, dishId, and clientName" },
        { status: 400 }
      );
    }

    // Find the dish in the menu
    const menuItems = await getEateryMenu(dataPath);
    let targetDish = null;

    for (const category of menuItems) {
      const dish = category.dishes.find(d => d.id === dishId);
      if (dish) {
        targetDish = dish;
        break;
      }
    }

    if (!targetDish) {
      return NextResponse.json(
        { error: "Dish not found" },
        { status: 404 }
      );
    }

    // Add the selection
    const selection = await dishSelectionStore.addSelection(
      targetDish,
      clientName,
      selectedOptions,
      quantity,
      note
    );

    // Broadcast update to all connected clients
    broadcastSelectionUpdate();

    return NextResponse.json(selection, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error("Error adding selection:", error);
    return NextResponse.json(
      { error: "Failed to add selection" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a selection
export async function DELETE(request: NextRequest) {
  try {
    await ensureInitialized();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clientName = searchParams.get('clientName');
    const password = searchParams.get('password');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (deleteAll) {
      // Validate password for delete all operation
      const expectedPassword = process.env.ADMIN_PASSWORD || 'HomNayAnGi';
      if (password !== expectedPassword) {
        return NextResponse.json(
          { error: "Sai mật khẩu" },
          { status: 403 }
        );
      }
      
      await dishSelectionStore.removeAllSelections();
      
      // Broadcast update to all connected clients
      broadcastSelectionUpdate();
      
      return NextResponse.json({ success: true }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing selection ID" },
        { status: 400 }
      );
    }

    if (!clientName) {
      return NextResponse.json(
        { error: "Missing client name" },
        { status: 400 }
      );
    }

    // Get the selection to check ownership
    const allSelections = await dishSelectionStore.getAllSelections();
    const targetSelection = allSelections.find(s => s.id === id);

    if (!targetSelection) {
      return NextResponse.json(
        { error: "Selection not found" },
        { status: 404 }
      );
    }

    // Check if the client name matches the selection's owner
    if (targetSelection.clientName !== clientName) {
      return NextResponse.json(
        { error: "You can only remove your own selections" },
        { status: 403 }
      );
    }

    const removed = await dishSelectionStore.removeSelection(id);

    if (!removed) {
      return NextResponse.json(
        { error: "Selection not found" },
        { status: 404 }
      );
    }

    // Broadcast update to all connected clients
    broadcastSelectionUpdate();

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error("Error removing selection:", error);
    return NextResponse.json(
      { error: "Failed to remove selection" },
      { status: 500 }
    );
  }
}

// PATCH - Update client name in all selections
export async function PATCH(request: NextRequest) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const { oldName, newName } = body;

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: "Missing required fields: oldName and newName" },
        { status: 400 }
      );
    }

    const updatedCount = await dishSelectionStore.updateClientName(oldName, newName);

    // Broadcast update to all connected clients
    broadcastSelectionUpdate();

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} selections with new name.`
    });
  } catch (error) {
    console.error("Error updating client name:", error);
    return NextResponse.json(
      { error: "Failed to update client name" },
      { status: 500 }
    );
  }
}
