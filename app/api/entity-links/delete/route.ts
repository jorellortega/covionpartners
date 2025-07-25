import { NextRequest, NextResponse } from 'next/server';
import { deleteEntityLink } from '@/lib/entity-links';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { source_entity_type, source_entity_id, target_entity_type, target_entity_id } = body;

    if (!source_entity_type || !source_entity_id || !target_entity_type || !target_entity_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error } = await deleteEntityLink(
      source_entity_type,
      source_entity_id,
      target_entity_type,
      target_entity_id
    );

    if (error) {
      console.error('Error deleting entity link:', error);
      return NextResponse.json(
        { error: 'Failed to delete entity link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/entity-links/delete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 