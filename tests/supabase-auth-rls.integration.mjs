import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

for (const [name, value] of Object.entries({
  SUPABASE_URL: url,
  SUPABASE_ANON_KEY: anonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
})) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
}

const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

const service = createClient(url, serviceKey, options);
const anonymous = createClient(url, anonKey, options);
const runTag = randomUUID().replaceAll("-", "").slice(0, 12);
const users = [];
const clients = [];
const quoteIds = [];
const paymentIds = [];
const ticketIds = [];
const historyQuoteIds = [];

function checkNoError(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message} (${result.error.code ?? "no-code"})`);
  }
  return result.data;
}

function ids(rows) {
  return rows.map((row) => row.id).sort();
}

async function createTemporaryUser(label) {
  const email = `ci-${label}-${runTag}@example.invalid`;
  const password = randomBytes(32).toString("base64url");
  const created = checkNoError(
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: `CI ${label}` },
    }),
    `Create temporary ${label} account`,
  );
  assert.ok(created.user?.id, `Auth did not return the ${label} user ID`);
  users.push({ id: created.user.id, email });

  const client = createClient(url, anonKey, options);
  clients.push(client);
  const signedIn = checkNoError(
    await client.auth.signInWithPassword({ email, password }),
    `Password sign-in for ${label}`,
  );
  assert.equal(signedIn.user.id, created.user.id);
  assert.ok(signedIn.session?.access_token, `${label} session was not issued`);
  return { id: created.user.id, email, client };
}

async function expectError(promise, label) {
  const result = await promise;
  assert.ok(result.error, `${label}: expected the API to reject the operation`);
  return result.error;
}

let failed = false;

try {
  const customer = await createTemporaryUser("customer");
  const administrator = await createTemporaryUser("administrator");

  // The database trigger must create profiles for real Auth-created users.
  const initialProfiles = checkNoError(
    await service.from("profiles").select("id,is_admin").in("id", [customer.id, administrator.id]),
    "Read trigger-created profiles",
  );
  assert.equal(initialProfiles.length, 2, "Auth profile trigger did not create both profiles");
  assert.ok(initialProfiles.every((profile) => profile.is_admin === false),
    "A new account received administrator privileges by default");

  // Grant administrator status only through the service-role client in this disposable DB.
  checkNoError(
    await service.from("profiles").update({ is_admin: true }).eq("id", administrator.id).select("id").single(),
    "Promote isolated administrator fixture",
  );

  const quoteA = checkNoError(
    await service.from("quotes").insert({
      email: customer.email,
      name: "Temporary customer",
      service: "CI isolation test",
      budget_calculated: 100,
      user_id: customer.id,
    }).select("id,user_id").single(),
    "Seed customer quote",
  );
  const quoteB = checkNoError(
    await service.from("quotes").insert({
      email: administrator.email,
      name: "Temporary administrator",
      service: "CI isolation test",
      budget_calculated: 200,
      user_id: administrator.id,
    }).select("id,user_id").single(),
    "Seed administrator quote",
  );
  quoteIds.push(quoteA.id, quoteB.id);
  historyQuoteIds.push(quoteA.id);

  const paymentA = checkNoError(
    await service.from("payments").insert({
      user_id: customer.id,
      stripe_session_id: `ci_${runTag}_customer`,
      product_id: "local-ci-only",
      status: "paid",
      amount_cents: 100,
    }).select("id").single(),
    "Seed customer payment row",
  );
  const paymentB = checkNoError(
    await service.from("payments").insert({
      user_id: administrator.id,
      stripe_session_id: `ci_${runTag}_administrator`,
      product_id: "local-ci-only",
      status: "paid",
      amount_cents: 200,
    }).select("id").single(),
    "Seed administrator payment row",
  );
  paymentIds.push(paymentA.id, paymentB.id);

  const ticketA = checkNoError(
    await service.from("support_tickets").insert({
      user_id: customer.id,
      subject: "CI customer fixture",
      message: "Temporary local-only test record",
    }).select("id").single(),
    "Seed customer support ticket",
  );
  const ticketB = checkNoError(
    await service.from("support_tickets").insert({
      user_id: administrator.id,
      subject: "CI administrator fixture",
      message: "Temporary local-only test record",
    }).select("id").single(),
    "Seed administrator support ticket",
  );
  ticketIds.push(ticketA.id, ticketB.id);

  // Password authentication, refresh, identity verification and invalid credentials.
  const refreshed = checkNoError(
    await customer.client.auth.refreshSession(),
    "Refresh customer session",
  );
  assert.ok(refreshed.session?.access_token, "Customer refresh did not return a session");
  const verified = checkNoError(
    await customer.client.auth.getUser(),
    "Verify customer identity from session",
  );
  assert.equal(verified.user.id, customer.id);

  const badLogin = await anonymous.auth.signInWithPassword({
    email: customer.email,
    password: "definitely-not-the-generated-password",
  });
  assert.ok(badLogin.error, "Invalid password was unexpectedly accepted");

  // RLS: customer sees only their own rows.
  const customerProfiles = checkNoError(
    await customer.client.from("profiles").select("id,is_admin"),
    "Customer profile visibility",
  );
  assert.deepEqual(ids(customerProfiles), [customer.id]);
  assert.equal(customerProfiles[0].is_admin, false);

  const customerQuotes = checkNoError(
    await customer.client.from("quotes").select("id,user_id"),
    "Customer quote visibility",
  );
  assert.deepEqual(ids(customerQuotes), [quoteA.id]);

  const customerPayments = checkNoError(
    await customer.client.from("payments").select("id,user_id"),
    "Customer payment visibility",
  );
  assert.deepEqual(ids(customerPayments), [paymentA.id]);

  const customerTickets = checkNoError(
    await customer.client.from("support_tickets").select("id,user_id"),
    "Customer ticket visibility",
  );
  assert.deepEqual(ids(customerTickets), [ticketA.id]);

  // Customers can create their own ticket, while server-managed lifecycle
  // fields remain protected by column-level INSERT privileges.
  const customerCreatedTicket = checkNoError(
    await customer.client.from("support_tickets").insert({
      user_id: customer.id,
      subject: "Customer-created CI ticket",
      message: "A valid customer support request.",
    }).select("id,status").single(),
    "Customer own support ticket insert",
  );
  ticketIds.push(customerCreatedTicket.id);
  assert.equal(customerCreatedTicket.status, "open",
    "A customer-controlled ticket did not receive the server default status");

  await expectError(
    customer.client.from("support_tickets").insert({
      user_id: customer.id,
      subject: "Attempted status override",
      message: "A customer must not set ticket lifecycle state.",
      status: "closed",
    }),
    "Customer override of server-managed support ticket status",
  );

  // Cross-account reads and writes must not disclose or modify the other account.
  const crossProfileUpdate = checkNoError(
    await customer.client.from("profiles")
      .update({ display_name: "unauthorized-change" })
      .eq("id", administrator.id)
      .select("id"),
    "Cross-account profile update",
  );
  assert.equal(crossProfileUpdate.length, 0, "Customer modified another profile");

  await expectError(
    customer.client.from("profiles")
      .update({ is_admin: true })
      .eq("id", customer.id),
    "Self-promotion to administrator",
  );

  await expectError(
    customer.client.from("support_tickets").insert({
      user_id: administrator.id,
      subject: "forbidden",
      message: "cross-account insert",
    }),
    "Cross-account support ticket insert",
  );

  const customerQuoteUpdate = checkNoError(
    await customer.client.from("quotes")
      .update({ status: "unauthorized" })
      .eq("id", quoteA.id)
      .select("id"),
    "Customer quote status update",
  );
  assert.equal(customerQuoteUpdate.length, 0, "Customer changed quote status without admin rights");

  // Sensitive financial ledger remains unavailable to client roles.
  await expectError(
    customer.client.from("stripe_invoices").select("stripe_invoice_id"),
    "Customer access to Stripe invoice ledger",
  );
  await expectError(
    anonymous.from("profiles").select("id"),
    "Anonymous profile access",
  );

  // Administrator can read all business rows and change quote status, but not write the payment ledger.
  const adminQuotes = checkNoError(
    await administrator.client.from("quotes").select("id,user_id"),
    "Administrator quote visibility",
  );
  assert.deepEqual(ids(adminQuotes), [quoteA.id, quoteB.id].sort());

  const adminPayments = checkNoError(
    await administrator.client.from("payments").select("id,user_id"),
    "Administrator payment visibility",
  );
  assert.deepEqual(ids(adminPayments), [paymentA.id, paymentB.id].sort());

  const adminTickets = checkNoError(
    await administrator.client.from("support_tickets").select("id,user_id"),
    "Administrator support ticket visibility",
  );
  assert.deepEqual(ids(adminTickets), [ticketA.id, ticketB.id, customerCreatedTicket.id].sort());

  const updatedQuote = checkNoError(
    await administrator.client.from("quotes")
      .update({ status: "en curso" })
      .eq("id", quoteA.id)
      .select("id,status")
      .single(),
    "Administrator quote status update",
  );
  assert.equal(updatedQuote.status, "en curso");

  checkNoError(
    await administrator.client.from("quote_status_history").insert({
      quote_id: quoteA.id,
      status: "en curso",
      changed_by: administrator.id,
    }),
    "Administrator quote history insert",
  );

  await expectError(
    administrator.client.from("payments")
      .update({ status: "refunded" })
      .eq("id", paymentA.id),
    "Administrator direct payment ledger mutation",
  );

  const ownerHistory = checkNoError(
    await customer.client.from("quote_status_history").select("quote_id,status"),
    "Customer history visibility for owned quote",
  );
  assert.equal(ownerHistory.length, 1);
  assert.equal(ownerHistory[0].quote_id, quoteA.id);

  await expectError(
    customer.client.from("quote_status_history").insert({
      quote_id: quoteA.id,
      status: "unauthorized",
      changed_by: customer.id,
    }),
    "Customer quote history insert",
  );

  // Explicitly end both local sessions before deleting the temporary Auth users.
  checkNoError(await customer.client.auth.signOut({ scope: "local" }), "Customer sign-out");
  checkNoError(await administrator.client.auth.signOut({ scope: "local" }), "Administrator sign-out");
  assert.equal(checkNoError(await customer.client.auth.getSession(), "Customer session after sign-out").session, null);
  assert.equal(checkNoError(await administrator.client.auth.getSession(), "Administrator session after sign-out").session, null);

  console.log("PASS: real Supabase Auth password sign-in, session refresh, identity verification, invalid credentials and sign-out");
  console.log("PASS: RLS ownership isolation for profiles, quotes, payments and support tickets");
  console.log("PASS: cross-account writes and client-side administrator escalation rejected");
  console.log("PASS: administrator reads and quote workflow permissions verified");
  console.log("PASS: financial ledger remains server-role-only");
} catch (error) {
  failed = true;
  console.error("FAIL: isolated Supabase Auth/RLS integration test");
  console.error(error?.stack ?? error);
} finally {
  const cleanupErrors = [];

  for (const client of clients) {
    try {
      await client.auth.signOut({ scope: "local" });
    } catch (error) {
      cleanupErrors.push(`session sign-out: ${error.message}`);
    }
  }

  for (const [table, values, column] of [
    ["quote_status_history", quoteIds, "quote_id"],
    ["support_tickets", ticketIds, "id"],
    ["payments", paymentIds, "id"],
    ["quotes", quoteIds, "id"],
  ]) {
    if (!values.length) continue;
    try {
      const result = await service.from(table).delete().in(column, values);
      if (result.error) cleanupErrors.push(`${table} cleanup: ${result.error.message}`);
    } catch (error) {
      cleanupErrors.push(`${table} cleanup: ${error.message}`);
    }
  }

  for (const user of users) {
    try {
      const deleted = await service.auth.admin.deleteUser(user.id);
      if (deleted.error) cleanupErrors.push(`Auth user deletion: ${deleted.error.message}`);
      const remaining = await service.auth.admin.getUserById(user.id);
      if (remaining.data?.user) cleanupErrors.push("A temporary Auth user remains after cleanup");
    } catch (error) {
      cleanupErrors.push(`Auth user cleanup: ${error.message}`);
    }
  }

  if (cleanupErrors.length) {
    console.error("CLEANUP ERROR: " + cleanupErrors.join("; "));
    failed = true;
  } else {
    console.log("PASS: temporary Auth users, sessions and test rows cleaned up");
  }
}

if (failed) process.exitCode = 1;
