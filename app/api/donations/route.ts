import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return NextResponse.json({ error: 'Session error' }, { status: 401 });
    }

    const body = await req.json();
    const {
      projectId,
      amount,
      processingFee,
      platformFee,
      totalAmount,
      paymentMethodId,
      message,
      isAnonymous
    } = body;

    // Validate required fields
    if (!projectId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid donation amount or project ID' }, { status: 400 });
    }

    // Get project owner's user ID first
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create transaction with proper type casting
    const transactionData = {
      user_id: session?.user?.id,
      type: 'payment',
      status: 'pending',
      amount: Number(totalAmount),
      project_id: projectId
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction', details: transactionError }, { status: 500 });
    }

    // Create donation record with all the metadata
    const donationData = {
      donor_id: isAnonymous ? null : session?.user?.id,
      recipient_id: project.owner_id,
      project_id: projectId,
      transaction_id: transaction.id,
      amount: Number(amount),
      processing_fee: Number(processingFee),
      platform_fee: Number(platformFee),
      total_amount: Number(totalAmount),
      payment_method_id: paymentMethodId,
      message,
      is_anonymous: isAnonymous,
      status: 'pending',
      metadata: {
        baseAmount: Number(amount),
        processingFee: Number(processingFee),
        platformFee: Number(platformFee)
      }
    };

    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert(donationData)
      .select()
      .single();

    if (donationError) {
      console.error('Donation error:', donationError);
      // Rollback transaction
      await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);
      return NextResponse.json({ error: 'Failed to create donation record', details: donationError }, { status: 500 });
    }

    // TODO: Process payment with Stripe
    // This would typically involve creating a payment intent and confirming it
    // For now, we'll simulate a successful payment

    // Update transaction and donation status to completed
    const [transactionUpdate, donationUpdate] = await Promise.all([
      supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id),
      supabase
        .from('donations')
        .update({ status: 'completed' })
        .eq('id', donation.id)
    ]);

    // Update recipient's balance
    const { error: balanceError } = await supabase.rpc('update_user_balance', {
      p_user_id: project.owner_id,
      p_amount: Number(amount) // Only add the base amount (excluding fees)
    });

    if (balanceError) {
      console.error('Balance update error:', balanceError);
      return NextResponse.json({ error: 'Failed to update recipient balance', details: balanceError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      donation: {
        id: donation.id,
        amount: donation.amount,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Donation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process donation' },
      { status: 500 }
    );
  }
} 