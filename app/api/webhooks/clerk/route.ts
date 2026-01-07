import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Initialize Convex HTTP client for server-side calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
    // Get the Svix headers for verification
    const svix_id = req.headers.get('svix-id');
    const svix_timestamp = req.headers.get('svix-timestamp');
    const svix_signature = req.headers.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new NextResponse('Error occurred -- no svix headers', {
            status: 400,
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Get the webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
    }

    // Create a new Svix instance with your secret
    const wh = new Webhook(webhookSecret);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new NextResponse('Error occurred', {
            status: 400,
        });
    }

    // Handle the webhook
    const eventType = evt.type;

    try {
        switch (eventType) {
            case 'user.created': {
                const { id, email_addresses, first_name, last_name, created_at } = evt.data;
                const email = email_addresses?.[0]?.email_address || '';
                const name = `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0];

                // Get tokenIdentifier from Clerk JWT
                // For Clerk, the tokenIdentifier is typically: clerk_<user_id>
                const tokenIdentifier = `clerk_${id}`;

                console.log('Syncing user to Convex:', { id, email, name, tokenIdentifier });

                // Call Convex mutation directly
                try {
                    const result = await convex.mutation(api.users.webhooks.syncUserFromClerk, {
                        webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,
                        tokenIdentifier,
                        email,
                        name,
                        clerkId: id,
                        createdAt: created_at ? new Date(created_at).getTime() : Date.now(),
                    });
                    console.log('User synced to Convex successfully:', result);
                } catch (error) {
                    console.error('Error calling Convex mutation:', error);
                }

                break;
            }

            case 'user.updated': {
                const { id, email_addresses, first_name, last_name } = evt.data;
                const email = email_addresses?.[0]?.email_address || '';
                const name = `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0];
                const tokenIdentifier = `clerk_${id}`;

                console.log('Updating user in Convex:', { id, email, name, tokenIdentifier });

                try {
                    const result = await convex.mutation(api.users.webhooks.syncUserFromClerk, {
                        webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,
                        tokenIdentifier,
                        email,
                        name,
                        clerkId: id,
                    });
                    console.log('User updated in Convex successfully:', result);
                } catch (error) {
                    console.error('Error calling Convex mutation:', error);
                }

                break;
            }

            case 'user.deleted': {
                const { id } = evt.data;
                const tokenIdentifier = `clerk_${id}`;

                console.log('Marking user as deleted in Convex:', { id, tokenIdentifier });

                try {
                    const result = await convex.mutation(api.users.webhooks.deleteUserFromClerk, {
                        webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,
                        tokenIdentifier,
                    });
                    console.log('User marked as deleted in Convex successfully:', result);
                } catch (error) {
                    console.error('Error calling Convex mutation:', error);
                }

                break;
            }

            case 'session.created': {
                const { user_id, id, last_active_at, expire_at } = evt.data;
                const tokenIdentifier = `clerk_${user_id}`;

                console.log('Syncing session to Convex:', { sessionId: id, userId: user_id, tokenIdentifier });

                try {
                    const result = await convex.mutation(api.users.webhooks.syncSessionFromClerk, {
                        webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,
                        sessionId: id,
                        tokenIdentifier,
                        lastActiveAt: last_active_at ? new Date(last_active_at).getTime() : Date.now(),
                        expiresAt: expire_at ? new Date(expire_at).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days default
                    });
                    console.log('Session synced to Convex successfully:', result);
                } catch (error) {
                    console.error('Error calling Convex mutation:', error);
                }

                break;
            }

            default:
                console.log(`Unhandled webhook event type: ${eventType}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

