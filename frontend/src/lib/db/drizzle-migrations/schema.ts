import { pgTable, varchar, unique, serial, foreignKey, integer, timestamp, boolean, text, doublePrecision, uniqueIndex, type AnyPgColumn, index, uuid, numeric, date, check, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const contractStatus = pgEnum("contract_status", ['draft', 'pending_review', 'revision_requested', 'accepted', 'declined', 'cancelled'])
export const enumJobsStatus = pgEnum("enum_jobs_status", ['draft', 'published', 'paused', 'filled', 'closed'])
export const enumOrdersStatus = pgEnum("enum_orders_status", ['active', 'completed', 'cancelled'])
export const enumOrdersType = pgEnum("enum_orders_type", ['proposal', 'direct'])
export const enumProposalsStatus = pgEnum("enum_proposals_status", ['pending', 'accepted', 'rejected'])


export const sequelizeMeta = pgTable("SequelizeMeta", {
	name: varchar({ length: 255 }).primaryKey().notNull(),
});

export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
}, (table) => [
	unique("roles_name_key").on(table.name),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	lastname: varchar({ length: 255 }),
	age: integer(),
	phone: varchar({ length: 255 }),
	username: varchar({ length: 255 }),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	roleId: integer("role_id"),
	profilePicture: varchar("profile_picture", { length: 255 }),
	dateOfBirth: timestamp("date_of_birth", { withTimezone: true, mode: 'string' }),
	streetAddress: varchar("street_address", { length: 255 }),
	aptSuite: varchar("apt_suite", { length: 255 }),
	city: varchar({ length: 255 }),
	state: varchar({ length: 255 }),
	zipCode: varchar("zip_code", { length: 255 }),
	country: varchar({ length: 255 }),
	isEmailVerified: boolean("is_email_verified").default(false),
	emailVerificationCode: varchar("email_verification_code", { length: 255 }),
	emailVerificationExpiresAt: timestamp("email_verification_expires_at", { withTimezone: true, mode: 'string' }),
	isPhoneVerified: boolean("is_phone_verified").default(false),
	lastLogin: timestamp("last_login", { withTimezone: true, mode: 'string' }),
	passwordResetCode: varchar("password_reset_code", { length: 255 }),
	passwordResetExpiresAt: timestamp("password_reset_expires_at", { withTimezone: true, mode: 'string' }),
	emailSendFailed: boolean("email_send_failed").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "users_role_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	unique("users_username_key").on(table.username),
	unique("users_email_key").on(table.email),
]);

export const budgetTypes = pgTable("budget_types", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 255 }).notNull(),
	label: varchar({ length: 255 }).notNull(),
	minAmount: integer("min_amount").notNull(),
	description: varchar({ length: 255 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique("budget_types_code_key").on(table.code),
]);

export const projectSizes = pgTable("project_sizes", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }),
}, (table) => [
	unique("project_sizes_code_key").on(table.code),
]);

export const durations = pgTable("durations", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 255 }).notNull(),
	label: varchar({ length: 255 }).notNull(),
}, (table) => [
	unique("durations_code_key").on(table.code),
]);

export const experienceLevels = pgTable("experience_levels", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
}, (table) => [
	unique("experience_levels_code_key").on(table.code),
]);

export const freelancerProfiles = pgTable("freelancer_profiles", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	professionalTitle: varchar("professional_title", { length: 255 }).notNull(),
	overview: text(),
	hourlyRate: doublePrecision("hourly_rate"),
	country: varchar({ length: 255 }),
	city: varchar({ length: 255 }),
	profileCompleted: boolean("profile_completed").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "freelancer_profiles_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("freelancer_profiles_user_id_key").on(table.userId),
]);

export const freelancerExperiences = pgTable("freelancer_experiences", {
	id: serial().primaryKey().notNull(),
	freelancerId: integer("freelancer_id").notNull(),
	jobTitle: varchar("job_title", { length: 255 }).notNull(),
	company: varchar({ length: 255 }).notNull(),
	location: varchar({ length: 255 }),
	city: varchar({ length: 255 }),
	startMonth: varchar("start_month", { length: 255 }).notNull(),
	startYear: integer("start_year").notNull(),
	endMonth: varchar("end_month", { length: 255 }),
	endYear: integer("end_year"),
	isCurrent: boolean("is_current").default(false),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.freelancerId],
			foreignColumns: [freelancerProfiles.id],
			name: "freelancer_experiences_freelancer_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const freelancerEducations = pgTable("freelancer_educations", {
	id: serial().primaryKey().notNull(),
	freelancerId: integer("freelancer_id").notNull(),
	institutionName: varchar("institution_name", { length: 255 }).notNull(),
	degree: varchar({ length: 255 }),
	fieldOfStudy: varchar("field_of_study", { length: 255 }),
	typeOfEducation: varchar("type_of_education", { length: 255 }),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("unique_freelancer_education").using("btree", table.freelancerId.asc().nullsLast().op("int4_ops"), table.institutionName.asc().nullsLast().op("int4_ops"), table.startDate.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.freelancerId],
			foreignColumns: [freelancerProfiles.id],
			name: "freelancer_educations_freelancer_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const freelancerLanguages = pgTable("freelancer_languages", {
	id: serial().primaryKey().notNull(),
	freelancerId: integer("freelancer_id").notNull(),
	language: varchar({ length: 255 }).notNull(),
	proficiency: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.freelancerId],
			foreignColumns: [freelancerProfiles.id],
			name: "freelancer_languages_freelancer_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const freelancerPortfolios = pgTable("freelancer_portfolios", {
	id: serial().primaryKey().notNull(),
	freelancerId: integer("freelancer_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	projectUrl: varchar("project_url", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.freelancerId],
			foreignColumns: [freelancerProfiles.id],
			name: "freelancer_portfolios_freelancer_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const freelancerSkills = pgTable("freelancer_skills", {
	id: serial().primaryKey().notNull(),
	freelancerId: integer("freelancer_id").notNull(),
	skillName: varchar("skill_name", { length: 255 }).notNull(),
	level: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("unique_freelancer_skill").using("btree", table.freelancerId.asc().nullsLast().op("int4_ops"), table.skillName.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.freelancerId],
			foreignColumns: [freelancerProfiles.id],
			name: "freelancer_skills_freelancer_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const contracts: any = pgTable("contracts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	createdBy: integer("created_by").notNull(),
	status: contractStatus().default('draft').notNull(),
	currentRevisionId: uuid("current_revision_id"),
	messageId: uuid("message_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_contracts_conversation").using("btree", table.conversationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "contracts_conversation_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "contracts_message_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.currentRevisionId],
			foreignColumns: [contractRevisions.id],
			name: "fk_current_revision"
		}).onDelete("set null"),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("categories_code_key").on(table.code),
]);

export const skills = pgTable("skills", {
	id: varchar({ length: 8 }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	categoryCode: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryCode],
			foreignColumns: [categories.code],
			name: "skills_categoryCode_fkey"
		}).onDelete("cascade"),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id"),
	senderId: integer("sender_id"),
	body: text().notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isDeleted: boolean("is_deleted").default(false).notNull(),
	replyToId: uuid("reply_to_id"),
	messageType: text("message_type").default('text').notNull(),
}, (table) => [
	index("idx_messages_conv_sent").using("btree", table.conversationId.asc().nullsLast().op("timestamptz_ops"), table.sentAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_messages_conversation").using("btree", table.conversationId.asc().nullsLast().op("uuid_ops"), table.sentAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_messages_sender").using("btree", table.senderId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_fkey"
		}),
	foreignKey({
			columns: [table.replyToId],
			foreignColumns: [table.id],
			name: "messages_reply_to_id_fkey"
		}).onDelete("set null"),
]);

export const proposals = pgTable("proposals", {
	id: serial().primaryKey().notNull(),
	jobId: integer("job_id").notNull(),
	freelancerId: integer("freelancer_id").notNull(),
	coverLetter: text("cover_letter").notNull(),
	proposedAmount: doublePrecision("proposed_amount").notNull(),
	estimatedDuration: varchar("estimated_duration", { length: 255 }).notNull(),
	status: enumProposalsStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_proposals_freelancer_id").using("btree", table.freelancerId.asc().nullsLast().op("int4_ops")),
	index("idx_proposals_job_id").using("btree", table.jobId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.jobId],
			foreignColumns: [jobs.id],
			name: "proposals_job_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.freelancerId],
			foreignColumns: [users.id],
			name: "proposals_freelancer_id_fkey"
		}).onDelete("cascade"),
	unique("unique_proposal_per_job_per_freelancer").on(table.jobId, table.freelancerId),
]);

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	type: enumOrdersType().default('proposal').notNull(),
	jobId: integer("job_id"),
	proposalId: integer("proposal_id"),
	clientId: integer("client_id").notNull(),
	freelancerId: integer("freelancer_id").notNull(),
	amount: doublePrecision().notNull(),
	description: text(),
	status: enumOrdersStatus().default('active').notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.jobId],
			foreignColumns: [jobs.id],
			name: "orders_job_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.proposalId],
			foreignColumns: [proposals.id],
			name: "orders_proposal_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "orders_client_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.freelancerId],
			foreignColumns: [users.id],
			name: "orders_freelancer_id_fkey"
		}).onDelete("restrict"),
	unique("orders_proposal_id_key").on(table.proposalId),
]);

export const messageAttachments = pgTable("message_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	messageId: uuid("message_id").notNull(),
	url: text().notNull(),
	fileName: text("file_name").notNull(),
	fileType: text("file_type").notNull(),
	mimeType: text("mime_type").notNull(),
	sizeBytes: integer("size_bytes").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_message_attachments_message").using("btree", table.messageId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "message_attachments_message_id_fkey"
		}).onDelete("cascade"),
]);

export const messageReactions = pgTable("message_reactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	messageId: uuid("message_id").notNull(),
	userId: integer("user_id").notNull(),
	emoji: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_message_reactions_message").using("btree", table.messageId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "message_reactions_message_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "message_reactions_user_id_fkey"
		}).onDelete("cascade"),
	unique("message_reactions_message_id_user_id_emoji_key").on(table.messageId, table.userId, table.emoji),
]);

export const contractRevisions: any = pgTable("contract_revisions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contractId: uuid("contract_id").notNull(),
	proposedBy: integer("proposed_by").notNull(),
	revisionNumber: integer("revision_number").default(1).notNull(),
	title: text().notNull(),
	scope: text().notNull(),
	deliverables: text().notNull(),
	price: numeric({ precision: 12, scale:  2 }).notNull(),
	currency: text().default('USD').notNull(),
	deadline: date().notNull(),
	paymentTerms: text("payment_terms").notNull(),
	additionalTerms: text("additional_terms"),
	changeSummary: text("change_summary"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_contract_revisions_contract").using("btree", table.contractId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [contracts.id],
			name: "contract_revisions_contract_id_fkey"
		}).onDelete("cascade"),
]);

export const contractSignatures = pgTable("contract_signatures", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contractId: uuid("contract_id").notNull(),
	userId: integer("user_id").notNull(),
	typedName: text("typed_name").notNull(),
	signedAt: timestamp("signed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
}, (table) => [
	index("idx_contract_signatures_contract").using("btree", table.contractId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [contracts.id],
			name: "contract_signatures_contract_id_fkey"
		}).onDelete("cascade"),
	unique("contract_signatures_contract_id_user_id_key").on(table.contractId, table.userId),
]);

export const conversations = pgTable("conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proposalId: integer("proposal_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	clientId: integer("client_id"),
	freelancerId: integer("freelancer_id"),
}, (table) => [
	uniqueIndex("idx_conversations_direct").using("btree", table.clientId.asc().nullsLast().op("int4_ops"), table.freelancerId.asc().nullsLast().op("int4_ops")).where(sql`(proposal_id IS NULL)`),
	foreignKey({
			columns: [table.proposalId],
			foreignColumns: [proposals.id],
			name: "conversations_proposal_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "conversations_client_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.freelancerId],
			foreignColumns: [users.id],
			name: "conversations_freelancer_id_fkey"
		}).onDelete("set null"),
]);

export const jobs = pgTable("jobs", {
	id: serial().primaryKey().notNull(),
	clientId: integer("client_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	category: varchar({ length: 255 }),
	skills: varchar({ length: 255 }).array().default(["RRAY[]::character varying[])::character varying(25"]),
	projectSize: varchar("project_size", { length: 255 }),
	duration: varchar({ length: 255 }),
	experienceLevel: varchar("experience_level", { length: 255 }),
	budgetType: varchar("budget_type", { length: 255 }),
	budgetAmount: integer("budget_amount"),
	attachment: varchar({ length: 255 }),
	status: enumJobsStatus().default('draft').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	hireCount: integer("hire_count").default(1).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "jobs_client_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	check("jobs_hire_count_check", sql`(hire_count >= 1) AND (hire_count <= 10)`),
]);

export const messageReads = pgTable("message_reads", {
	messageId: uuid("message_id").notNull(),
	userId: integer("user_id").notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_message_reads_message").using("btree", table.messageId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "message_reads_message_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "message_reads_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.messageId, table.userId], name: "message_reads_pkey"}),
]);
