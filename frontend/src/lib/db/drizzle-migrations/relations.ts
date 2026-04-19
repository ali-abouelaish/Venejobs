import { relations } from "drizzle-orm/relations";
import { roles, users, freelancerProfiles, freelancerExperiences, freelancerEducations, freelancerLanguages, freelancerPortfolios, freelancerSkills, conversations, contracts, messages, contractRevisions, categories, skills, jobs, proposals, orders, messageAttachments, messageReactions, contractSignatures, messageReads } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id]
	}),
	freelancerProfiles: many(freelancerProfiles),
	messages: many(messages),
	proposals: many(proposals),
	orders_clientId: many(orders, {
		relationName: "orders_clientId_users_id"
	}),
	orders_freelancerId: many(orders, {
		relationName: "orders_freelancerId_users_id"
	}),
	messageReactions: many(messageReactions),
	conversations_clientId: many(conversations, {
		relationName: "conversations_clientId_users_id"
	}),
	conversations_freelancerId: many(conversations, {
		relationName: "conversations_freelancerId_users_id"
	}),
	jobs: many(jobs),
	messageReads: many(messageReads),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	users: many(users),
}));

export const freelancerProfilesRelations = relations(freelancerProfiles, ({one, many}) => ({
	user: one(users, {
		fields: [freelancerProfiles.userId],
		references: [users.id]
	}),
	freelancerExperiences: many(freelancerExperiences),
	freelancerEducations: many(freelancerEducations),
	freelancerLanguages: many(freelancerLanguages),
	freelancerPortfolios: many(freelancerPortfolios),
	freelancerSkills: many(freelancerSkills),
}));

export const freelancerExperiencesRelations = relations(freelancerExperiences, ({one}) => ({
	freelancerProfile: one(freelancerProfiles, {
		fields: [freelancerExperiences.freelancerId],
		references: [freelancerProfiles.id]
	}),
}));

export const freelancerEducationsRelations = relations(freelancerEducations, ({one}) => ({
	freelancerProfile: one(freelancerProfiles, {
		fields: [freelancerEducations.freelancerId],
		references: [freelancerProfiles.id]
	}),
}));

export const freelancerLanguagesRelations = relations(freelancerLanguages, ({one}) => ({
	freelancerProfile: one(freelancerProfiles, {
		fields: [freelancerLanguages.freelancerId],
		references: [freelancerProfiles.id]
	}),
}));

export const freelancerPortfoliosRelations = relations(freelancerPortfolios, ({one}) => ({
	freelancerProfile: one(freelancerProfiles, {
		fields: [freelancerPortfolios.freelancerId],
		references: [freelancerProfiles.id]
	}),
}));

export const freelancerSkillsRelations = relations(freelancerSkills, ({one}) => ({
	freelancerProfile: one(freelancerProfiles, {
		fields: [freelancerSkills.freelancerId],
		references: [freelancerProfiles.id]
	}),
}));

export const contractsRelations = relations(contracts, ({one, many}) => ({
	conversation: one(conversations, {
		fields: [contracts.conversationId],
		references: [conversations.id]
	}),
	message: one(messages, {
		fields: [contracts.messageId],
		references: [messages.id]
	}),
	contractRevision: one(contractRevisions, {
		fields: [contracts.currentRevisionId],
		references: [contractRevisions.id],
		relationName: "contracts_currentRevisionId_contractRevisions_id"
	}),
	contractRevisions: many(contractRevisions, {
		relationName: "contractRevisions_contractId_contracts_id"
	}),
	contractSignatures: many(contractSignatures),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	contracts: many(contracts),
	messages: many(messages),
	proposal: one(proposals, {
		fields: [conversations.proposalId],
		references: [proposals.id]
	}),
	user_clientId: one(users, {
		fields: [conversations.clientId],
		references: [users.id],
		relationName: "conversations_clientId_users_id"
	}),
	user_freelancerId: one(users, {
		fields: [conversations.freelancerId],
		references: [users.id],
		relationName: "conversations_freelancerId_users_id"
	}),
}));

export const messagesRelations = relations(messages, ({one, many}) => ({
	contracts: many(contracts),
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	user: one(users, {
		fields: [messages.senderId],
		references: [users.id]
	}),
	message: one(messages, {
		fields: [messages.replyToId],
		references: [messages.id],
		relationName: "messages_replyToId_messages_id"
	}),
	messages: many(messages, {
		relationName: "messages_replyToId_messages_id"
	}),
	messageAttachments: many(messageAttachments),
	messageReactions: many(messageReactions),
	messageReads: many(messageReads),
}));

export const contractRevisionsRelations = relations(contractRevisions, ({one, many}) => ({
	contracts: many(contracts, {
		relationName: "contracts_currentRevisionId_contractRevisions_id"
	}),
	contract: one(contracts, {
		fields: [contractRevisions.contractId],
		references: [contracts.id],
		relationName: "contractRevisions_contractId_contracts_id"
	}),
}));

export const skillsRelations = relations(skills, ({one}) => ({
	category: one(categories, {
		fields: [skills.categoryCode],
		references: [categories.code]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	skills: many(skills),
}));

export const proposalsRelations = relations(proposals, ({one, many}) => ({
	job: one(jobs, {
		fields: [proposals.jobId],
		references: [jobs.id]
	}),
	user: one(users, {
		fields: [proposals.freelancerId],
		references: [users.id]
	}),
	orders: many(orders),
	conversations: many(conversations),
}));

export const jobsRelations = relations(jobs, ({one, many}) => ({
	proposals: many(proposals),
	orders: many(orders),
	user: one(users, {
		fields: [jobs.clientId],
		references: [users.id]
	}),
}));

export const ordersRelations = relations(orders, ({one}) => ({
	job: one(jobs, {
		fields: [orders.jobId],
		references: [jobs.id]
	}),
	proposal: one(proposals, {
		fields: [orders.proposalId],
		references: [proposals.id]
	}),
	user_clientId: one(users, {
		fields: [orders.clientId],
		references: [users.id],
		relationName: "orders_clientId_users_id"
	}),
	user_freelancerId: one(users, {
		fields: [orders.freelancerId],
		references: [users.id],
		relationName: "orders_freelancerId_users_id"
	}),
}));

export const messageAttachmentsRelations = relations(messageAttachments, ({one}) => ({
	message: one(messages, {
		fields: [messageAttachments.messageId],
		references: [messages.id]
	}),
}));

export const messageReactionsRelations = relations(messageReactions, ({one}) => ({
	message: one(messages, {
		fields: [messageReactions.messageId],
		references: [messages.id]
	}),
	user: one(users, {
		fields: [messageReactions.userId],
		references: [users.id]
	}),
}));

export const contractSignaturesRelations = relations(contractSignatures, ({one}) => ({
	contract: one(contracts, {
		fields: [contractSignatures.contractId],
		references: [contracts.id]
	}),
}));

export const messageReadsRelations = relations(messageReads, ({one}) => ({
	message: one(messages, {
		fields: [messageReads.messageId],
		references: [messages.id]
	}),
	user: one(users, {
		fields: [messageReads.userId],
		references: [users.id]
	}),
}));