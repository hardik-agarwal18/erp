# ERP System Design — 1000+ Architect-Level Interview & Self-Study Questions

This document contains a curated set of architect-level questions across the major domains of a modern ERP/SaaS platform. Use them for interview prep, design reviews, or self-assessment.

---

## 1. Multi-Tenancy

1. What are the trade-offs between shared schema, separate schema, and separate database multi-tenancy models?
2. How would you design a tenant identification strategy (subdomain, header, JWT claim) for an API gateway?
3. How do you prevent cross-tenant data leakage when using a shared database with row-level tenant IDs?
4. How would you implement tenant-aware connection pooling in a microservices architecture?
5. What is "noisy neighbor" risk in multi-tenant systems, and how do you mitigate it?
6. How would you design tenant onboarding so that provisioning a new tenant is fully automated?
7. How do you handle tenant-specific configuration (feature flags, business rules, currency, locale)?
8. What strategies exist for migrating a tenant from a shared schema to a dedicated database as they scale?
9. How would you design database indexes and partitioning to keep queries efficient with millions of tenant rows?
10. How do you enforce tenant isolation at the application layer vs. the database layer (e.g., RLS in Postgres)?
11. How would you design a tenant-aware caching layer (Redis) to avoid cache key collisions?
12. What are the implications of multi-tenancy on background jobs and schedulers?
13. How would you design tenant-level rate limiting at the API gateway?
14. How do you handle tenant data residency requirements (e.g., EU tenants must store data in EU regions)?
15. How would you design a "tenant context" object that propagates through service calls, Kafka events, and async jobs?
16. What are the challenges of running database migrations across thousands of tenant schemas?
17. How would you design tenant-specific customizations (custom fields, custom workflows) without forking the codebase?
18. How do you bill tenants accurately when usage is metered across multiple microservices?
19. How would you architect a "trial tenant" lifecycle including auto-suspension and data retention after expiry?
20. How do you design audit logging so logs are queryable per tenant but stored efficiently at scale?
21. How would you handle a tenant requesting a full data export (GDPR-style) across a microservices architecture?
22. What's your approach to testing multi-tenancy isolation (automated tests that simulate cross-tenant access attempts)?
23. How would you design tenant-aware search (e.g., Elasticsearch indices per tenant vs. shared index with filters)?
24. How do you handle schema evolution when different tenants are on different application versions?
25. How would you design a super-admin/operator console that can access any tenant's data for support, with full audit trail?
26. What is "tenant sharding" and how would you decide the sharding key for an ERP database?
27. How do you design disaster recovery so that a single tenant's data corruption doesn't require restoring the entire platform?
28. How would you handle tenant-specific SLAs (e.g., enterprise tenants get dedicated compute)?
29. How do you design tenant identity federation (SSO/SAML) when each tenant has its own identity provider?
30. How would you architect feature rollout so new features can be enabled per-tenant (canary by tenant)?
31. How do you handle cross-tenant reporting for the platform owner (aggregate analytics) without violating isolation?
32. What are the security implications of a JWT containing tenant_id, and how do you prevent tampering?
33. How would you design a system to detect and alert on anomalous cross-tenant access patterns?
34. How do you handle tenant deletion (right to be forgotten) across relational DBs, search indices, caches, and object storage?
35. How would you design tenant-level encryption keys (BYOK - bring your own key) for enterprise customers?
36. What considerations go into choosing between a single Kafka cluster with tenant-partitioned topics vs. per-tenant topics?
37. How do you design API versioning so different tenants can be on different API versions simultaneously?
38. How would you handle a "merge two tenants" use case (e.g., company acquisition)?
39. How do you design tenant-aware database connection limits to avoid exhausting connection pools under load?
40. What monitoring/observability metrics would you track per-tenant (latency, error rate, resource consumption)?
41. How would you design a multi-region multi-tenant architecture for global customers with low-latency requirements?
42. How do you handle tenant-specific business calendars (fiscal year start, holidays) across accounting modules?
43. How would you design tenant provisioning to support white-labeling (custom domains, branding)?
44. What is the impact of multi-tenancy on database backup and restore strategy?
45. How do you design tenant usage quotas (storage, API calls, users) and enforce them gracefully?
46. How would you architect a "sandbox" environment per tenant for testing integrations before going live?
47. How do you handle tenant-specific data archival policies (e.g., archive records older than 7 years)?
48. How would you design cross-service transaction consistency for a single tenant's operation spanning multiple microservices?
49. What are the pros and cons of using PostgreSQL Row-Level Security (RLS) vs. application-enforced tenant filters?
50. How would you design a tenant health-score system to proactively detect tenants at risk of churn due to performance issues?
51. How do you design tenant-aware feature toggling combined with A/B testing infrastructure?
52. How would you migrate a large enterprise tenant's data with zero downtime from one shard/cluster to another?
53. How do you design tenant-level cost attribution for cloud infrastructure (showing each tenant's compute/storage cost)?


---

## 2. Accounting & General Ledger

54. How would you design a double-entry accounting engine that guarantees debits always equal credits?
55. What database schema would you use to represent ledger entries to ensure immutability and auditability?
56. How do you handle multi-currency transactions and foreign exchange revaluation in the general ledger?
57. How would you design a system to support multiple concurrent fiscal years (open and closed periods)?
58. How do you implement period-end closing such that no new transactions can be posted to a closed period?
59. What is the difference between a "posted" and "draft" journal entry, and how does this affect your data model?
60. How would you design reversal entries for correcting mistakes without deleting historical records?
61. How do you handle accrual accounting vs. cash accounting in the same system for different tenants/entities?
62. How would you design the system to support multiple accounting standards (GAAP, IFRS) simultaneously?
63. How do you ensure the general ledger remains performant as the number of journal entries grows into the billions?
64. How would you design a trial balance report that's computed efficiently without scanning all transactions?
65. How do you handle intercompany transactions and eliminations in a multi-entity ERP?
66. What's your approach to designing a sub-ledger architecture (AR, AP, Fixed Assets) that reconciles with the GL?
67. How would you design the system to support deferred revenue recognition over time?
68. How do you handle currency rounding differences in multi-currency consolidation?
69. How would you architect a system for automated bank reconciliation matching transactions to ledger entries?
70. How do you design year-end closing entries and retained earnings rollover automatically?
71. How would you ensure that financial reports are reproducible at any point in time (point-in-time reporting)?
72. How do you handle tax calculations (VAT/GST/sales tax) as part of the journal posting process?
73. How would you design the system to support cost center and department-level accounting?
74. How do you design audit trails for every change to financial data, including who, what, when, and why?
75. How would you implement a "trial run" or simulation mode for journal postings before committing?
76. How do you handle accounting for inventory write-offs, returns, and adjustments in the GL?
77. What's your approach to designing budget vs. actuals tracking integrated with the GL?
78. How would you design a flexible posting rules engine so different transaction types map to different GL accounts?
79. How do you ensure idempotency when posting journal entries triggered by asynchronous events (e.g., Kafka)?
80. How would you design multi-book accounting (e.g., statutory books vs. management books) for the same transactions?
81. How do you handle accounting for accrued expenses and prepaid expenses with automated amortization schedules?
82. How would you design the system to support consolidation of financial statements across subsidiaries with different currencies?
83. How do you ensure data consistency between the accounting module and other modules (inventory, sales) using events?
84. How would you design a general ledger that supports both batch posting and real-time posting?
85. How do you handle historical exchange rate lookups for transactions posted in the past?
86. What's your approach to designing financial period locking with role-based exceptions (e.g., controller override)?
87. How would you design the system to detect and prevent duplicate journal entries?
88. How do you architect the GL to support drill-down from a summary report to the originating transaction?
89. How would you design a chart of accounts mapping layer for tenants migrating from legacy systems?
90. How do you handle accounting for fixed assets, including depreciation schedules and disposal?
91. How would you design the system to support real-time financial dashboards without impacting transactional performance (CQRS)?
92. How do you handle reversing accruals automatically at the start of a new period?
93. What's your approach to designing approval workflows for journal entries above a certain threshold?
94. How would you design a general ledger snapshot mechanism for fast period-over-period comparisons?
95. How do you ensure referential integrity between journal lines and their source documents (invoices, payments)?
96. How would you design the system to handle backdated transactions and their impact on already-closed reports?
97. How do you architect support for statutory reporting requirements that vary by country?
98. How would you design a ledger reconciliation process between modules (e.g., AP sub-ledger vs. GL control account)?
99. How do you handle multi-level approval and segregation of duties for high-value journal entries?
100. How would you design the GL schema to support both summary and detail-level postings efficiently?
101. How do you handle currency translation adjustments (CTA) for consolidated financial statements?
102. What's your approach to designing an audit-proof "immutable ledger" using append-only storage or event sourcing?
103. How would you design the system to support parallel valuation methods (e.g., local GAAP and group IFRS) for the same transaction?
104. How do you handle accounting period transitions when a tenant changes their fiscal year-end?


---

## 3. Chart of Accounts

105. How would you design a flexible Chart of Accounts (CoA) structure that supports hierarchical account groupings?
106. What's the difference between a "natural account" and a "segment" in a segmented CoA design, and how would you model it?
107. How would you design the CoA to support multiple legal entities each with slightly different account structures while enabling consolidation?
108. How do you handle renumbering or restructuring the CoA without breaking historical reports?
109. How would you design account types (asset, liability, equity, revenue, expense) and enforce valid debit/credit behavior per type?
110. How do you support tenant-specific custom account segments (e.g., project, location, cost center) in the CoA?
111. How would you design a CoA template library that tenants can choose from during onboarding (industry-specific templates)?
112. How do you enforce uniqueness and validation rules on account codes across a multi-entity tenant?
113. How would you design the system to support "control accounts" that are only updated via sub-ledger postings, never directly?
114. How do you handle mapping a tenant's custom CoA to a standardized reporting taxonomy (e.g., for regulatory filings)?
115. How would you design account hierarchies that support both a "legal" rollup and a "management" rollup simultaneously?
116. How do you version the CoA so that historical transactions reference the CoA structure as it existed at posting time?
117. How would you design the system to prevent posting to summary/parent accounts (only allow postings to leaf accounts)?
118. How do you handle merging or deactivating accounts that have historical transactions?
119. How would you design an API for bulk import/export of the Chart of Accounts with validation?
120. How do you support multi-language account descriptions in the CoA for global tenants?
121. How would you design the CoA data model to efficiently support millions of accounts across thousands of tenants?
122. How do you handle default account assignment rules (e.g., default revenue account per product category)?
123. How would you design the system to detect orphaned or unused accounts and suggest cleanup?
124. How do you support different CoA structures for statutory vs. management reporting within the same tenant?
125. How would you design audit logging for changes to the Chart of Accounts (who added/modified/deactivated an account)?
126. How do you handle account-level permissions (e.g., only finance admins can post to certain sensitive accounts)?
127. How would you design the CoA to support dimensional accounting (account + cost center + project + location combinations)?
128. How do you ensure CoA changes propagate correctly to budgeting, reporting, and integration modules?
129. How would you design a "shadow CoA" for what-if scenario modeling without affecting production data?
130. How do you handle currency designation per account (e.g., accounts that must always be in a specific currency)?
131. How would you design the system to support account-level tax codes and default tax treatments?
132. How do you ensure backward compatibility when a tenant upgrades from a simple CoA to a segmented CoA?
133. How would you design search and autocomplete for account selection in transaction entry screens with large CoAs?
134. How do you handle CoA synchronization when integrating with external accounting systems (e.g., QuickBooks, SAP)?
135. How would you design the system to support "elimination accounts" used only during consolidation?
136. How do you model the relationship between the CoA and financial statement line items (balance sheet, P&L mapping)?
137. How would you design role-based views of the CoA (e.g., AP clerks see only expense accounts)?
138. How do you handle CoA changes mid-fiscal-year and their effect on comparative reporting?
139. How would you design the system to validate that every transaction type has a complete and valid account mapping before go-live?
140. How do you support "memo accounts" or statistical accounts that track non-monetary quantities (e.g., headcount)?
141. How would you design caching for the CoA hierarchy to avoid repeated tree traversals during report generation?
142. How do you handle CoA inheritance for new entities created from a template entity?
143. How would you design the system to flag accounts that haven't had activity in N periods for review?
144. How do you support multiple numbering schemes for the same conceptual account across different jurisdictions?
145. How would you design an approval workflow for proposed changes to the CoA before they go live?
146. How do you handle the impact of CoA restructuring on previously generated financial statements and dashboards?
147. How would you design the system to support "natural account groups" used for cash flow statement categorization?
148. How do you ensure the CoA design scales to support both small businesses (50 accounts) and large enterprises (50,000 accounts)?
149. How would you design a diff/comparison tool to show CoA changes between two points in time?
150. How do you handle currency and exchange rate accounts (e.g., realized/unrealized gain-loss accounts) in the CoA structure?
151. How would you design the relationship between the CoA and budget hierarchies for variance reporting?
152. How do you support "suspense accounts" for transactions that can't be immediately classified, with workflows to resolve them?
153. How would you design CoA data export formats compatible with common standards (XBRL, SAF-T)?
154. How do you handle account code length and format validation across tenants with different national standards (e.g., German SKR03/04)?
155. How would you design the system to support seasonal or temporary accounts that are only active during certain periods?
156. How do you ensure consistent CoA governance across a tenant's multiple business units while allowing local flexibility?
157. How would you design an automated CoA health-check report (duplicate accounts, inconsistent types, missing mappings)?


---

## 4. Journal Engine

158. How would you design a journal engine that converts business events (e.g., "invoice created") into balanced journal entries?
159. What design pattern would you use to define posting rules declaratively rather than hardcoding them per transaction type?
160. How do you ensure atomicity when a single business transaction must post to multiple journals (GL, AR, inventory)?
161. How would you design the journal engine to support templated journal entries (recurring entries like rent, depreciation)?
162. How do you handle journal entry validation (balanced, valid accounts, open period) before persisting?
163. How would you design the engine to support multi-currency journal lines with both transaction currency and functional currency amounts?
164. How do you implement idempotent journal posting when the same business event might be delivered more than once (Kafka at-least-once)?
165. How would you design a journal entry numbering scheme that's sequential, gapless (if required by law), and tenant-scoped?
166. How do you handle journal entries that span multiple accounting periods (e.g., a transaction that needs to be split/prorated)?
167. How would you design the system to support manual journal entries alongside system-generated ones, with clear distinction?
168. How do you implement a "dry run" mode in the journal engine to preview the GL impact before committing?
169. How would you design the journal engine to support reversing/voiding entries while preserving the audit trail?
170. How do you handle rounding rules consistently across journal lines to ensure the entry always balances?
171. How would you design a rules engine that maps a sales order line to debit/credit accounts based on product category, tax, and region?
172. How do you ensure journal posting performance at scale (e.g., batch posting thousands of entries during month-end)?
173. How would you design the system to support "what-if" journal simulations for scenario planning?
174. How do you handle journal entries originating from different sub-ledgers (AR, AP, fixed assets, payroll) with consistent formatting?
175. How would you design the journal engine's event consumption so failures (e.g., invalid account) go to a dead-letter queue for review?
176. How do you support inter-period adjustments (e.g., late-arriving invoices for a closed period) via automated reopening or suspense logic?
177. How would you design the journal engine to log the "source document" reference for every line for traceability?
178. How do you handle currency conversion timing — at transaction date, posting date, or payment date — and configure this per tenant?
179. How would you design the journal engine to be extensible via plugins for tenant-specific custom posting logic?
180. How do you ensure the journal engine doesn't become a bottleneck when many microservices emit accounting events concurrently?
181. How would you design schema validation for incoming "journal request" events from other services?
182. How do you handle partial failures, e.g., 8 out of 10 journal lines post successfully but 2 fail validation?
183. How would you design the journal engine to support both real-time (synchronous) and batch (asynchronous) posting modes?
184. How do you implement journal entry approval workflows that pause posting until approved, without blocking the source transaction?
185. How would you design a test harness to verify posting rules produce correct, balanced entries for hundreds of transaction scenarios?
186. How do you handle posting rule versioning so historical entries reflect the rules in effect at the time they were posted?
187. How would you design the journal engine to support multi-book postings (one business event → multiple parallel ledgers)?
188. How do you ensure traceability from a Kafka event ID to the resulting journal entry for debugging and reconciliation?
189. How would you design the system to detect and alert on "unbalanced" or anomalous journal entries in real time?
190. How do you handle currency rounding differences that accumulate across thousands of journal lines in a batch run?
191. How would you design the journal engine's data model to support both summarized and line-item-level posting?
192. How do you support journal entries that need to be posted to multiple legal entities (intercompany) atomically?
193. How would you design the engine to allow finance teams to define new posting rules via a UI without code deployment?
194. How do you handle the scenario where a posting rule references an account that doesn't exist for a given tenant?
195. How would you design retry and backoff strategies for the journal engine when downstream GL writes fail transiently?
196. How do you ensure the journal engine maintains a complete event sourcing log so the GL state can be rebuilt from scratch if needed?
197. How would you design the system to support "memo" or "statistical" journal entries that don't affect financial balances?
198. How do you handle journal entries generated from recurring schedules (e.g., monthly amortization) including pause/resume/cancel?
199. How would you design the journal engine to integrate with the approval workflow service via events rather than direct calls?
200. How do you ensure consistent decimal precision and currency formatting across the journal engine, database, and reporting layers?
201. How would you design a reconciliation job that compares journal engine output totals against source transaction totals nightly?
202. How do you handle journal posting for "negative" transactions like credit notes, refunds, and write-offs distinctly from standard entries?
203. How would you design the journal engine to support configurable approval thresholds based on entry amount, account, or entity?
204. How do you ensure the journal engine's posting rules are testable in isolation via unit tests without a live database?
205. How would you design the system to migrate posting rules from a legacy ERP into the new journal engine's rule format?
206. How do you handle high-cardinality dimensions (e.g., thousands of cost centers) in journal line storage without bloating the schema?
207. How would you design monitoring dashboards specifically for the journal engine (posting latency, failure rate, queue depth)?
208. How do you ensure that journal engine changes (new posting rules) can be tested in a staging environment against production-like data safely?
209. How would you design the system to handle "split" journal lines, e.g., allocating one expense across multiple cost centers by percentage?
210. How do you architect the journal engine to support eventual consistency with other modules while giving finance teams confidence in data accuracy?


---

## 5. Inventory Valuation

211. How would you design a system to support multiple inventory valuation methods (FIFO, LIFO, weighted average, specific identification) per item or tenant?
212. How do you handle inventory valuation changes (e.g., switching from FIFO to weighted average) and the impact on historical reports?
213. How would you design the data model to track inventory cost layers for FIFO/LIFO costing?
214. How do you handle landed cost allocation (freight, duties, insurance) across received inventory items?
215. How would you design the system to revalue inventory when standard costs change, and post the resulting GL adjustments?
216. How do you handle inventory valuation for items with serial numbers or lot/batch tracking?
217. How would you design the system to calculate weighted average cost incrementally as new receipts arrive, without recalculating from scratch?
218. How do you handle negative inventory scenarios and their impact on cost calculations?
219. How would you design inventory valuation to support multi-currency purchases (cost recorded in purchase currency vs. functional currency)?
220. How do you handle inventory write-downs for obsolete or slow-moving stock (lower of cost or market / NRV adjustments)?
221. How would you design the system to support standard costing with variance analysis (purchase price variance, usage variance)?
222. How do you handle valuation for in-transit inventory (goods shipped but not yet received)?
223. How would you design the system to support different valuation methods per warehouse or location for the same item?
224. How do you ensure inventory valuation calculations are performant when processing millions of transactions during month-end close?
225. How would you design a reconciliation process between the inventory sub-ledger and the GL inventory account?
226. How do you handle inventory valuation for kits/bundles composed of multiple component items?
227. How would you design the system to support backdated inventory transactions and recalculate valuations retroactively?
228. How do you handle costing for returns — should returned items be valued at original cost or current cost?
229. How would you design the system to support periodic vs. perpetual inventory valuation methods?
230. How do you handle inventory valuation adjustments due to currency revaluation of foreign-currency-denominated inventory?
231. How would you design an audit trail that shows exactly how an item's current unit cost was derived (layer-by-layer)?
232. How do you handle valuation for manufactured/assembled items where cost is derived from BOM components plus labor/overhead?
233. How would you design the system to flag and handle scenarios where cost layers run out (FIFO depletion exceeds available layers)?
234. How do you support valuation snapshots for point-in-time inventory value reporting (e.g., balance sheet as of any date)?
235. How would you design the system to handle inventory transfers between warehouses with different valuation methods?
236. How do you handle rounding errors that accumulate in weighted average cost calculations over many transactions?
237. How would you design the system to support cost adjustments from supplier invoices that arrive after goods receipt (invoice price variance)?
238. How do you handle valuation of consigned inventory that's physically on-site but not owned until consumed?
239. How would you design event-driven architecture so inventory valuation updates are triggered by goods receipt, shipment, and adjustment events?
240. How do you ensure inventory valuation engine results are deterministic and reproducible for audit purposes?
241. How would you design the system to support multiple costing methods running in parallel for management vs. statutory reporting?
242. How do you handle scrap, byproduct, and co-product valuation in manufacturing scenarios?
243. How would you design caching of current unit costs for fast lookups during sales order pricing, while keeping them eventually consistent with the valuation engine?
244. How do you handle inventory valuation impacts of physical count adjustments (cycle counts, annual physical inventory)?
245. How would you design the system to calculate and post Cost of Goods Sold (COGS) at the time of shipment vs. invoicing?
246. How do you handle valuation for items that are tracked by both quantity and weight/volume (dual unit of measure)?
247. How would you design the system to support cost rollups for multi-level BOMs efficiently (avoiding recursive recalculation storms)?
248. How do you handle the interaction between inventory valuation and tax requirements that mandate specific costing methods (e.g., LIFO restrictions in some countries)?
249. How would you design a "what-if" simulation tool to show the GL impact of switching valuation methods before committing?
250. How do you handle inventory valuation for drop-ship items that never physically enter the warehouse?
251. How would you design the data model to efficiently query "current value of inventory on hand" across millions of SKUs and locations?
252. How do you handle valuation timing differences between when goods are physically received vs. when ownership transfers (Incoterms)?
253. How would you design the system to support automated month-end inventory valuation jobs with rollback capability if errors are detected?
254. How do you handle cost layer adjustments when a purchase order is retroactively changed (price correction after receipt)?
255. How would you design monitoring to detect inventory valuation anomalies (e.g., negative costs, extreme cost spikes)?
256. How do you handle valuation for items under quality hold or quarantine that shouldn't be included in available-to-sell calculations?
257. How would you design the system to support different units of measure for purchasing, stocking, and selling with correct cost conversions?
258. How do you handle the GL posting of inventory valuation adjustments to ensure they tie back to specific transactions for audit?
259. How would you design the system to support valuation for inventory held by third-party logistics providers (3PL)?
260. How do you ensure inventory valuation reports can be generated for any historical date without re-running the entire valuation engine?
261. How would you design the system to handle inventory valuation method changes mid-year and the disclosure requirements that follow?
262. How do you architect the inventory valuation service so it can scale independently from the order management and warehouse services?
263. How would you design data retention and archival for inventory cost layers that are no longer active but needed for historical audits?


---

## 6. Warehouse Operations

264. How would you design a warehouse management system (WMS) data model to support multiple warehouses, zones, aisles, racks, and bins?
265. How do you design the inbound process (purchase order → ASN → goods receipt → put-away) as a series of microservice interactions?
266. How would you design a picking strategy engine that supports wave picking, batch picking, and zone picking?
267. How do you handle inventory reservation/allocation to prevent overselling when multiple orders compete for the same stock?
268. How would you design the system to support directed put-away based on item velocity, size, or storage requirements?
269. How do you handle real-time inventory visibility across warehouses when updates come from barcode scanners with intermittent connectivity?
270. How would you design the system to support cycle counting workflows without halting normal warehouse operations?
271. How do you handle cross-docking scenarios where inbound goods are routed directly to outbound shipments?
272. How would you design the data model for tracking inventory at multiple levels of granularity (warehouse, zone, bin, lot, serial)?
273. How do you handle partial shipments and backorders in the warehouse fulfillment process?
274. How would you design the system to optimize pick paths to minimize travel time within a warehouse?
275. How do you handle returns processing (RMA) including inspection, restocking, and disposal workflows?
276. How would you design the system to support multiple units of measure conversions during picking, packing, and shipping?
277. How do you handle inventory holds (quality, legal, damaged) so held stock isn't available for allocation?
278. How would you design integration with shipping carriers (label generation, rate shopping, tracking) as a separate microservice?
279. How do you handle warehouse transfer orders between locations, including in-transit inventory tracking?
280. How would you design the system to support real-time dashboards showing warehouse throughput, picker productivity, and order SLAs?
281. How do you handle exception scenarios like short picks (insufficient stock found during picking) and their downstream effects on orders?
282. How would you design the system to support task interleaving (combining put-away and picking tasks for warehouse workers)?
283. How do you handle barcode/RFID scanning events at scale, ensuring they're processed reliably even during network partitions?
284. How would you design the system to support packing station workflows, including cartonization (choosing optimal box sizes)?
285. How do you handle inventory adjustments from damages, shrinkage, or theft, including approval workflows and GL impact?
286. How would you design the system to support different fulfillment models (B2B bulk, B2C parcel, omnichannel ship-from-store)?
287. How do you handle warehouse labor management, including task assignment, productivity tracking, and shift scheduling?
288. How would you design the system to support slotting optimization (re-arranging item locations based on demand patterns)?
289. How do you handle multi-tenant warehouse operations where a 3PL manages inventory for multiple client companies?
290. How would you design the event flow for "order ready to ship" notifications across order management, WMS, and shipping services?
291. How do you handle expiration date (FEFO - first expired, first out) picking logic alongside FIFO/LIFO valuation?
292. How would you design the system to support kitting/assembly operations within the warehouse (combining components into sellable kits)?
293. How do you handle warehouse capacity planning and alerts when storage utilization approaches limits?
294. How would you design the system to support voice-picking or wearable device integrations for warehouse staff?
295. How do you handle synchronization between the WMS and e-commerce platforms for real-time stock availability?
296. How would you design the system to support drop-shipment workflows where the warehouse never holds the inventory?
297. How do you handle warehouse-level access control (which staff can access which zones, especially high-value or restricted items)?
298. How would you design the data model to support serialized inventory tracking for warranty and recall purposes?
299. How do you handle peak-season scalability for warehouse operations (e.g., holiday order surges)?
300. How would you design the system to support automated replenishment tasks (moving stock from bulk storage to pick faces)?
301. How do you handle exception handling for mis-picks, mis-ships, and the resulting inventory corrections?
302. How would you design a service boundary between "Inventory Service" (source of truth for quantities) and "Warehouse Operations Service" (tasks, picking, packing)?
303. How do you handle inventory snapshots for accurate point-in-time reporting given constant warehouse movement?
304. How would you design the system to support automated guided vehicles (AGVs) or robotics integration in the warehouse workflow?
305. How do you handle multi-step put-away (e.g., received into staging, then moved to final bin) and track location history?
306. How would you design the system to support configurable warehouse workflows per tenant (some tenants need QC steps, others don't)?
307. How do you handle inventory in transit between warehouse zones during a physical relocation/reorganization project?
308. How would you design the system to provide real-time "available to promise" (ATP) calculations factoring in reserved, on-hand, and incoming stock?
309. How do you handle warehouse operations during system downtime (offline mode for scanners, with later synchronization)?
310. How would you design alerts for stockouts, overstock, and slow-moving inventory across the warehouse network?
311. How do you handle the data model and workflow for hazardous materials storage with compliance requirements (segregation rules)?
312. How would you design the system to support consignment inventory management within a warehouse (owned by supplier until consumed)?
313. How do you handle integration between warehouse operations and the accounting module for real-time COGS recognition at shipment?


---

## 7. Sales & CRM

314. How would you design the data model for leads, opportunities, accounts, and contacts in a multi-tenant CRM?
315. How do you design a sales pipeline/stage management system that supports custom stages per tenant?
316. How would you design the system to convert a quote into a sales order and eventually into an invoice, ensuring data consistency?
317. How do you handle pricing rules that depend on customer tier, volume discounts, promotions, and contract-specific pricing?
318. How would you design the system to support multi-currency quoting for global customers?
319. How do you handle CRM activity tracking (emails, calls, meetings) and link them to deals and accounts?
320. How would you design the system to support sales territory management and automatic lead routing/assignment?
321. How do you handle approval workflows for discounts beyond a sales rep's authority threshold?
322. How would you design the system to calculate sales commissions based on configurable rules tied to deal attributes?
323. How do you handle duplicate detection and merging for leads, contacts, and accounts?
324. How would you design the system to support quote versioning, allowing customers to negotiate through multiple revisions?
325. How do you handle integration between the CRM and marketing automation tools for lead scoring and nurturing?
326. How would you design the system to support subscription-based sales (recurring billing, renewals, upsells) alongside one-time sales?
327. How do you handle the data model for products with complex configurations (configure-price-quote / CPQ scenarios)?
328. How would you design the system to support sales forecasting based on pipeline data and historical conversion rates?
329. How do you handle order-to-cash workflow events (order placed → fulfilled → invoiced → paid) across multiple services via Kafka?
330. How would you design the system to support partial order fulfillment and its impact on invoicing?
331. How do you handle credit limit checks for customers before allowing new sales orders?
332. How would you design the system to support customer-specific catalogs (different products/prices visible to different customers)?
333. How do you handle returns and exchanges initiated from the sales side and their integration with warehouse RMA processes?
334. How would you design the system to support multi-channel sales (direct sales, e-commerce, marketplace) with a unified order model?
335. How do you handle sales tax determination based on customer location, product type, and nexus rules?
336. How would you design the system to support contract management (start/end dates, auto-renewal, termination clauses) tied to recurring orders?
337. How do you handle customer segmentation for targeted pricing and promotions at scale?
338. How would you design the system to support sales order holds (credit hold, fraud review) before fulfillment begins?
339. How do you handle the relationship between CRM opportunities and quote/proposal documents generated as PDFs?
340. How would you design the system to support team selling (multiple reps collaborating on one account) with shared visibility?
341. How do you handle historical price tracking so reports can show what price was quoted/charged at any point in time?
342. How would you design the system to support sales order amendments after the order has been partially fulfilled?
343. How do you handle integration between CRM activities and the notification service (reminders for follow-ups, renewal alerts)?
344. How would you design the system to calculate customer lifetime value (CLV) using data spanning sales, support, and billing?
345. How do you handle multi-level approval for large enterprise deals (manager, VP, finance sign-off)?
346. How would you design the system to support price books that change over time, with effective date ranges?
347. How do you handle the data model for bundled products/services sold together with allocated revenue recognition?
348. How would you design the system to support sales analytics dashboards (win/loss rates, average deal size, sales cycle length) computed efficiently?
349. How do you handle customer account hierarchies (parent company with multiple subsidiaries, each with their own orders)?
350. How would you design the system to support automated dunning workflows for overdue invoices tied to sales accounts?
351. How do you handle GDPR/privacy requirements for CRM data (consent tracking, right to be forgotten) across sales records?
352. How would you design the system to support sales order cancellation and its cascading effects (inventory release, invoice voiding)?
353. How do you handle integration with e-signature services for contract and quote approvals?
354. How would you design the system to support real-time inventory availability checks during quote/order creation?
355. How do you handle the audit trail for changes to sales orders (price overrides, discount approvals, quantity changes)?
356. How would you design the system to support sales rep performance dashboards with role-based data visibility?
357. How do you handle data synchronization between the CRM and ERP when they're separate microservices but need a unified customer view?
358. How would you design the system to support omni-channel customer support tickets linked to sales/account history?
359. How do you handle currency and tax recalculation when a sales order's ship-to address changes after creation?
360. How would you design the system to support sales campaigns with time-bound promotional pricing and automatic expiration?
361. How do you handle the scenario where a customer has multiple billing addresses and shipping addresses tied to one account?
362. How would you design event schemas for "OrderCreated", "OrderUpdated", and "OrderCancelled" to be consumed reliably by inventory, accounting, and shipping services?
363. How do you handle sales order line-item level taxes, discounts, and shipping charges in the pricing calculation engine?


---

## 8. Procurement

364. How would you design the procurement workflow from purchase requisition to purchase order to goods receipt to vendor invoice (P2P cycle)?
365. How do you handle three-way matching (PO, goods receipt, invoice) and discrepancy resolution?
366. How would you design the system to support approval workflows for purchase requisitions based on amount, department, and category?
367. How do you handle vendor management, including vendor onboarding, qualification, and performance scoring?
368. How would you design the system to support request-for-quote (RFQ) processes where multiple vendors bid on the same requirement?
369. How do you handle blanket purchase orders/contracts that are drawn down over time via multiple releases?
370. How would you design the system to support multi-currency purchase orders with exchange rate locking at PO creation?
371. How do you handle partial goods receipts against a purchase order and their impact on PO status and accounting?
372. How would you design the system to support automated reordering based on reorder points, lead times, and demand forecasts?
373. How do you handle vendor invoice processing including OCR/data extraction from uploaded invoice documents?
374. How would you design the system to detect duplicate vendor invoices before they're paid?
375. How do you handle procurement approval delegation (e.g., when an approver is on leave, requests route to a backup)?
376. How would you design the system to support catalog-based purchasing (punch-out catalogs, internal item catalogs)?
377. How do you handle landed cost estimation at the PO stage vs. actual landed cost at receipt for budgeting purposes?
378. How would you design the system to support procurement budgets per department/cost center with real-time budget checks?
379. How do you handle the data model for vendor contracts, including pricing agreements, payment terms, and SLAs?
380. How would you design the system to support drop-ship purchase orders where goods ship directly from vendor to customer?
381. How do you handle vendor master data deduplication and the risk of fraudulent vendor records (fraud prevention)?
382. How would you design the system to support procurement of services (non-stock items) alongside physical goods, with different approval flows?
383. How do you handle currency and tax implications for cross-border procurement (import duties, VAT reverse charge)?
384. How would you design the system to support automated PO generation from MRP (material requirements planning) runs?
385. How do you handle the audit trail for purchase order amendments after vendor acknowledgment?
386. How would you design the system to integrate with vendor portals for order acknowledgment, ASN submission, and invoice status?
387. How do you handle procurement card (P-card) transactions and their reconciliation with the GL?
388. How would you design the system to support split funding for a single PO across multiple cost centers or projects?
389. How do you handle vendor payment terms (net 30, 2/10 net 30) and early payment discount calculations?
390. How would you design the system to support a "preferred vendor" ranking and automatically suggest vendors during requisition?
391. How do you handle the scenario where goods are received but the invoice hasn't arrived yet (GR/IR clearing account)?
392. How would you design the system to support spend analytics across categories, vendors, and departments for procurement strategy?
393. How do you handle return-to-vendor (RTV) processes for defective or excess goods, including credit memo tracking?
394. How would you design the system to enforce segregation of duties (requisitioner ≠ approver ≠ receiver ≠ payer)?
395. How do you handle procurement for capital expenditures (CapEx) with integration to fixed asset creation upon receipt?
396. How would you design the system to support automated vendor invoice approval routing based on PO match results?
397. How do you handle multi-level approval hierarchies that change dynamically based on organizational structure changes?
398. How would you design the system to support sustainability/ESG scoring of vendors as part of the procurement decision process?
399. How do you handle currency revaluation for open purchase orders denominated in foreign currencies?
400. How would you design the system to support emergency/rush purchase orders that bypass standard approval timelines with post-approval?
401. How do you handle vendor self-service portals for invoice submission, payment status inquiries, and document uploads?
402. How would you design the system to support procurement analytics on PO cycle time (requisition to receipt to payment)?
403. How do you handle the impact of a cancelled purchase order on already-processed partial receipts and payments?
404. How would you design event-driven integration so that "GoodsReceived" events trigger both inventory updates and three-way match checks?
405. How do you handle multi-tenant vendor master data where some vendors are shared across tenants (e.g., a marketplace model) and some are tenant-specific?
406. How would you design the system to support procurement compliance checks (sanctioned party screening, restricted goods lists)?
407. How do you handle the reconciliation between accrued liabilities (goods received, not invoiced) and actual vendor invoices over time?
408. How would you design the system to support configurable approval matrices that can be edited by tenant admins without code changes?
409. How do you handle data retention and audit requirements for procurement records (often 7+ years for tax purposes)?
410. How would you design the system to support automated three-way match tolerance thresholds (e.g., allow up to 2% price variance)?
411. How do you handle integration between the procurement module and the notification service for PO approvals, vendor confirmations, and exception alerts?
412. How would you design the system to support analytics on procurement savings (negotiated price vs. catalog price)?
413. How do you handle scenarios where a single vendor invoice covers multiple purchase orders or partial deliveries across several POs?


---

## 9. Approval Workflows

414. How would you design a generic, reusable approval workflow engine that can be applied across modules (PO, journal entries, sales discounts, leave requests)?
415. How do you model approval chains that can be sequential, parallel, or a combination (e.g., manager AND finance, then VP)?
416. How would you design the system to support dynamic approver resolution (e.g., "the requester's manager" rather than a hardcoded user)?
417. How do you handle approval delegation when an approver is unavailable (out of office, auto-escalation rules)?
418. How would you design the workflow engine to support conditional branching based on document attributes (amount, category, region)?
419. How do you handle SLA tracking for approvals, including automated reminders and escalations for overdue approvals?
420. How would you design the system to support "any one of N approvers" vs. "all N approvers must approve" configurations?
421. How do you handle the audit trail for approval workflows, capturing who approved/rejected, when, and any comments?
422. How would you design the workflow engine to be configurable via a visual builder (drag-and-drop) by non-developer admins?
423. How do you handle versioning of approval workflow definitions so in-flight approvals aren't disrupted by configuration changes?
424. How would you design the system to support re-routing an approval if the document is modified after submission (e.g., amount changes)?
425. How do you handle integration between the approval workflow engine and the notification service (email, push, in-app alerts to approvers)?
426. How would you design the system to support approval via email (approve/reject links) without requiring login?
427. How do you handle rollback or cancellation of an in-progress approval workflow if the requester withdraws the request?
428. How would you design the workflow engine's data model to be decoupled from the business entities it approves (generic "approvable object")?
429. How do you handle multi-tenant customization of approval workflows where each tenant defines their own rules and hierarchies?
430. How would you design the system to support approval workflows that span multiple microservices (e.g., a sales discount approval that also needs inventory confirmation)?
431. How do you handle out-of-band approvals (e.g., an approval that happened verbally/offline) being recorded retroactively with proper authorization?
432. How would you design the workflow engine to support time-based auto-approval (if no action within X hours, auto-approve or auto-reject)?
433. How do you handle the scenario where an approver is also the requester (self-approval prevention)?
434. How would you design the system to provide a unified "approval inbox" for users who are approvers across multiple modules?
435. How do you handle approval workflow performance at scale (thousands of pending approvals across a large enterprise tenant)?
436. How would you design the system to support nested/sub-approvals (e.g., a PO approval that triggers a budget approval as a sub-step)?
437. How do you handle the security model ensuring only authorized users can approve, and approvals can't be spoofed via API calls?
438. How would you design the workflow engine to support approval workflows triggered by Kafka events from other services?
439. How do you handle reporting on approval workflow metrics (average approval time, bottleneck approvers, rejection rates)?
440. How would you design the system to support comments/attachments during the approval process for context-sharing?
441. How do you handle approval workflows for sensitive actions like deleting financial records or modifying user permissions (RBAC changes)?
442. How would you design the workflow engine to integrate with the audit log service to ensure every state transition is recorded immutably?
443. How do you handle scenarios where approval rules depend on external data (e.g., current budget remaining, fetched from another service)?
444. How would you design the system to support "approval groups" (any member of Finance Team can approve) vs. named individual approvers?
445. How do you handle workflow engine failures (e.g., service downtime) without losing pending approval state?
446. How would you design the system to support a preview/simulation mode showing the full approval chain before a user submits a request?
447. How do you handle multi-language notification templates for approval requests sent to international approvers?
448. How would you design the workflow engine schema to support arbitrary new approval types being added without schema migrations (polymorphic associations)?
449. How do you handle the case where an approval workflow needs to pause for external input (e.g., waiting on a vendor response) before resuming?
450. How would you design the system to support bulk approvals (an approver approving 50 pending requests at once)?
451. How do you handle approval workflow testing — how would you write automated tests for complex multi-step, conditional workflows?
452. How would you design the system to support approval workflow templates that can be cloned and customized per department?
453. How do you handle the impact of organizational changes (e.g., a manager leaves the company) on in-flight and future approval workflows?
454. How would you design the system to ensure approval workflow state is consistent even if multiple approvers act simultaneously (race conditions)?
455. How do you handle approval workflows that require different approval levels in different currencies for a global company (e.g., $10K USD vs €10K EUR thresholds)?
456. How would you design the system to support a "withdraw and resubmit" flow where a rejected request can be corrected and resubmitted into the same workflow?
457. How do you handle compliance requirements that mandate certain approvals cannot be skipped or bypassed even by administrators?
458. How would you design the workflow engine's API so other services can query "is this document fully approved?" efficiently without polling?
459. How do you handle long-running approval workflows (weeks/months) and ensure they don't get lost or forgotten in the system?
460. How would you design the system to support escalation chains where an unapproved request automatically moves up the management hierarchy after a timeout?
461. How do you handle workflow definition testing in a sandbox before deploying changes to production approval flows?
462. How would you design the approval engine to emit events (e.g., "ApprovalGranted", "ApprovalRejected") that other services subscribe to for downstream actions?
463. How do you handle the UX/data design for showing a requester the full status and history of their approval request across all steps?
464. How would you design role-based visibility so that approvers only see requests relevant to their scope (department, region, amount threshold)?
465. How do you handle approval workflows involving external parties (e.g., a customer must approve a quote before it proceeds internally)?
466. How would you design the system to support "conditional skip" logic, e.g., skip the finance approval step if the requester already has budget pre-approved?


---

## 10. Audit Logs

467. How would you design an audit logging system that captures every create, update, and delete operation across all microservices?
468. How do you decide what to log — full before/after snapshots, field-level diffs, or just event metadata — and what are the trade-offs?
469. How would you design the audit log storage to be tamper-proof (e.g., append-only, cryptographically chained/hash-linked entries)?
470. How do you handle the performance impact of audit logging on high-throughput write paths (e.g., async logging via Kafka)?
471. How would you design the audit log schema to support querying by user, entity type, entity ID, date range, and action type efficiently?
472. How do you handle audit logging for read access to sensitive data (e.g., who viewed a customer's financial records), not just writes?
473. How would you design the system to ensure audit logs themselves are protected from unauthorized modification, even by system administrators?
474. How do you handle audit log retention policies that vary by data type and regulatory requirement (e.g., 7 years for financial records)?
475. How would you design the system to support audit log search and export for compliance audits (SOC 2, ISO 27001) efficiently?
476. How do you handle correlating audit log entries across multiple microservices for a single business transaction (using a correlation/trace ID)?
477. How would you design the system to capture "who, what, when, where (IP/device), and why (reason code)" for sensitive operations?
478. How do you handle audit logging volume at scale — what storage technology would you choose (e.g., append-only DB, cold storage, log aggregation systems)?
479. How would you design the system to support real-time alerting on suspicious audit log patterns (e.g., bulk data exports, repeated failed access attempts)?
480. How do you handle audit logs for configuration changes (e.g., changes to approval workflows, RBAC roles, system settings)?
481. How would you design the system to ensure audit logs are generated even if the primary operation fails partway through (partial transaction logging)?
482. How do you handle multi-tenant audit log isolation, ensuring tenant admins can only see their own tenant's logs?
483. How would you design the system to capture "impersonation" events when a support engineer accesses a tenant's account on their behalf?
484. How do you handle audit log replay for forensic investigation — reconstructing the state of an entity at any point in time from its audit trail?
485. How would you design the system to differentiate between system-generated changes (automated jobs) and user-initiated changes in the audit log?
486. How do you handle versioning of audit log schemas as the underlying business entities evolve over time?
487. How would you design audit logging for bulk operations (e.g., a bulk update affecting 10,000 records) without creating 10,000 individual log entries that overwhelm storage?
488. How do you handle GDPR "right to be forgotten" requests when audit logs contain personal data that legally must be retained for compliance?
489. How would you design the system to support exporting audit logs in formats required by external auditors (CSV, structured JSON, SIEM-compatible formats)?
490. How do you handle audit logging for failed login attempts, permission denials, and other security-relevant events distinct from business data changes?
491. How would you design a centralized audit log service that all microservices publish to via Kafka, ensuring no service is tightly coupled to the audit log's storage implementation?
492. How do you handle the trade-off between storing audit logs in the same database as operational data vs. a separate dedicated audit store?
493. How would you design the system to support "diff view" UIs that show exactly what changed in a record between two audit log entries?
494. How do you handle audit logging for batch jobs and scheduled tasks, attributing changes to "system" with job metadata (job ID, run time)?
495. How would you design the system to ensure audit log timestamps are accurate and consistent across distributed services (clock synchronization issues)?
496. How do you handle indexing strategy for an audit log table that could grow to billions of rows, balancing write throughput and query performance?
497. How would you design the system to support audit log archival to cold storage (e.g., S3 Glacier) while still allowing on-demand retrieval for audits?
498. How do you handle audit logging requirements that differ by jurisdiction (e.g., some countries require specific fields or retention periods)?
499. How would you design the system to log not just data changes but also "intent" — e.g., capturing the reason/justification a user enters for an override?
500. How do you handle the scenario where audit log ingestion (Kafka consumer) falls behind during a traffic spike — what's your backpressure strategy?
501. How would you design role-based access to audit logs themselves (e.g., only security team can view authentication logs, only finance can view GL audit trails)?
502. How do you handle audit logging for API access (which API keys/service accounts accessed which endpoints, with what parameters)?
503. How would you design the system to support "audit log integrity verification" — periodic checks that the hash chain hasn't been tampered with?
504. How do you handle the storage cost trade-offs of audit logging at a granular level across a platform with thousands of tenants and millions of daily transactions?
505. How would you design the system to support compliance reports that prove segregation of duties was maintained (e.g., no single user both created and approved a transaction)?
506. How do you handle audit logging for data exports/downloads, capturing what data left the system and to whom?
507. How would you design an audit log dashboard for security teams to monitor anomalies across the platform in near real-time?
508. How do you handle the challenge of audit logs referencing entities that have since been deleted (maintaining referential context without foreign key constraints)?
509. How would you design the system to support "legal hold" — freezing audit logs and related data from deletion/archival when litigation is anticipated?
510. How do you handle audit log testing — how do you verify that all critical operations are correctly generating audit entries (automated coverage checks)?


---

## 11. RBAC (Role-Based Access Control)

511. How would you design an RBAC system that supports roles, permissions, and resource-level (object-level) access control?
512. How do you handle the difference between role-based, attribute-based (ABAC), and relationship-based (ReBAC) access control, and when would you combine them?
513. How would you design the data model for permissions to support fine-grained actions (view, create, edit, delete, approve, export) per module?
514. How do you handle hierarchical roles where a higher role inherits all permissions of lower roles, plus additional ones?
515. How would you design the system to support custom roles defined by tenant admins, beyond a fixed set of system roles?
516. How do you handle row-level / record-level permissions (e.g., a sales rep can only see their own accounts, a manager sees their team's)?
517. How would you design RBAC checks to be performant — avoiding a database lookup on every single API request?
518. How do you handle caching of permission data while ensuring permission changes (e.g., role revoked) take effect promptly?
519. How would you design the system to support field-level permissions (e.g., HR can edit salary field, managers can only view it)?
520. How do you handle RBAC in a microservices architecture — centralized authorization service vs. embedding permission checks in each service?
521. How would you design JWT claims to carry role/permission information without making tokens too large or stale?
522. How do you handle permission checks for asynchronous operations (e.g., a background job acting on behalf of a user)?
523. How would you design the system to support delegation of access (a user temporarily grants another user access to their tasks/approvals)?
524. How do you handle the audit trail for RBAC changes (role assignments, permission modifications) given their security sensitivity?
525. How would you design the system to support multi-tenant RBAC where platform-level roles (super admin) differ from tenant-level roles?
526. How do you handle the scenario where a user has multiple roles with potentially conflicting permissions (deny vs. allow precedence)?
527. How would you design the system to support time-bound role assignments (e.g., temporary elevated access for 24 hours)?
528. How do you handle permission checks for nested/hierarchical resources (e.g., access to a "company" implies access to its "departments" and "projects")?
529. How would you design an RBAC policy testing framework to verify that role configurations don't accidentally grant excessive permissions?
530. How do you handle the principle of least privilege when designing default roles for new tenant signups?
531. How would you design the system to support "impersonation" for support staff with full audit logging and time-limited access?
532. How do you handle RBAC for API integrations (service accounts, API keys) with scoped permissions distinct from human user roles?
533. How would you design the system to support permission checks that depend on data state (e.g., can only edit an invoice if it's in "draft" status)?
534. How do you handle migrating from a simple role system (admin/user) to a granular permission-based system without breaking existing tenants?
535. How would you design the system to provide a UI for tenant admins to visualize "who can access what" across their organization?
536. How do you handle separation of duties enforcement within RBAC (e.g., a user with "create vendor" permission cannot also have "approve payment" permission)?
537. How would you design the system to support permission inheritance through organizational hierarchy (department → team → individual)?
538. How do you handle RBAC performance at scale — how would you design permission resolution for a tenant with 10,000 users and 500 custom roles?
539. How would you design the system to support "deny" rules that override broader "allow" rules (explicit deny precedence)?
540. How do you handle RBAC for multi-entity tenants where a user might have different roles in different subsidiaries?
541. How would you design the system to enforce RBAC consistently across the API, background jobs, reporting/BI tools, and direct database access?
542. How do you handle the scenario where a role's permissions change while a user has an active session — how/when do the changes take effect?
543. How would you design the system to support permission bundles/templates that can be assigned together (e.g., "Accountant" bundle = view GL + create journal + view reports)?
544. How do you handle RBAC testing in CI/CD — automated tests that verify endpoints enforce the correct permission checks?
545. How would you design the system to support contextual permissions (e.g., a manager can approve expenses only for their direct reports)?
546. How do you handle the security risk of "privilege escalation" bugs — what design and testing practices mitigate this?
547. How would you design the system to log and alert on permission check failures that might indicate probing/attack attempts?
548. How do you handle RBAC for cross-service data aggregation (e.g., a dashboard service that queries data from 5 services — how does it enforce the user's permissions consistently)?
549. How would you design a permission model that supports both "can do X on resource Y" and "can do X on all resources of type Y owned by Z"?
550. How do you handle the UX of permission errors — showing meaningful messages without leaking information about resources the user shouldn't know exist?
551. How would you design the system to support emergency "break glass" access for critical incidents, with mandatory post-incident review?
552. How do you handle versioning of role definitions so that historical audit logs correctly show what permissions a role had at a given time?
553. How would you design the system to integrate RBAC with SSO/identity providers, mapping external groups/claims to internal roles?
554. How do you handle RBAC for shared resources (e.g., a shared report or dashboard that multiple roles across departments can access with different edit rights)?
555. How would you design an authorization service API (e.g., "can user X perform action Y on resource Z?") to be both expressive and fast (sub-10ms)?
556. How do you handle bulk permission changes (e.g., reorganizing departments affects hundreds of users' effective permissions) without performance degradation?
557. How would you design the system to support "view as" functionality where an admin can preview the UI/data as it would appear to a specific role?
558. How do you handle RBAC documentation and discoverability — how do developers know which permission gates which functionality across a large codebase?
559. How would you design the system to prevent a tenant admin from accidentally locking themselves out of their own account (no users left with admin role)?
560. How do you handle the interplay between RBAC and feature flags/entitlements (e.g., a role might have permission, but the tenant's plan doesn't include the feature)?


---

## 12. Notifications

561. How would you design a notification service that supports multiple channels (email, SMS, push, in-app, webhook) from a single API?
562. How do you handle notification templating with support for multi-language and tenant-specific branding?
563. How would you design the system to support user notification preferences (which events trigger which channels, opt-in/opt-out)?
564. How do you handle notification deduplication when multiple services might trigger similar notifications for the same event?
565. How would you design the system to support notification batching/digesting (e.g., "you have 5 new approvals" instead of 5 separate emails)?
566. How do you handle delivery guarantees and retries for notifications when a channel provider (e.g., email gateway) is temporarily down?
567. How would you design the system to track notification delivery status (sent, delivered, opened, clicked, bounced, failed)?
568. How do you handle rate limiting to prevent notification spam (e.g., a buggy service triggering thousands of duplicate notifications)?
569. How would you design the notification service to consume events from Kafka and map them to notification templates dynamically?
570. How do you handle notification priority levels (critical alerts vs. informational) and ensure critical ones aren't delayed by queue backlogs?
571. How would you design the system to support scheduled/delayed notifications (e.g., "remind me about this invoice in 3 days")?
572. How do you handle multi-tenant notification configuration where each tenant can bring their own email sending domain (custom SMTP/SES configuration)?
573. How would you design the system to support in-app notification centers with read/unread state, pagination, and real-time updates (websockets)?
574. How do you handle notification content personalization (merging dynamic data like user name, amounts, dates into templates) safely (avoiding injection issues)?
575. How would you design the system to support digest emails (daily/weekly summaries) aggregated from multiple individual events?
576. How do you handle the scenario where a notification references data that has since changed or been deleted (e.g., notification about an invoice that was later voided)?
577. How would you design the system to support push notification delivery to mobile devices, including device token management and platform-specific payloads (APNs, FCM)?
578. How do you handle compliance requirements for SMS/email notifications (unsubscribe links, quiet hours, regional regulations like TCPA/GDPR)?
579. How would you design the system to support webhook notifications to external systems with retry logic, signing/verification, and failure alerting?
580. How do you handle notification testing — how would you verify that the right notifications are sent for the right events without spamming real users during testing?
581. How would you design the system to support escalation notifications (e.g., if an approval isn't actioned in 24 hours, notify the approver's manager)?
582. How do you handle the architecture for a notification service to scale to millions of notifications per day without becoming a bottleneck for event-producing services?
583. How would you design the system to support A/B testing of notification content/timing to optimize engagement?
584. How do you handle notification template versioning so changes to a template don't retroactively alter the content of already-sent notifications in the history view?
585. How would you design the system to support transactional vs. marketing notification separation, with different compliance and opt-out rules?
586. How do you handle localization of dates, currencies, and numbers within notification templates for global tenants?
587. How would you design the system to support "notification rules" that tenant admins configure (e.g., "notify finance team when any invoice over $10,000 is created")?
588. How do you handle the failure mode where the notification service itself is down — do upstream events queue up, get dropped, or trigger fallback alerts?
589. How would you design the system to support unsubscribe management centrally across all notification types and channels?
590. How do you handle notification audit trails — proving that a required notification (e.g., a legal disclosure) was actually sent to a user?
591. How would you design the system to support real-time alerts to operations/DevOps teams (PagerDuty/Slack integration) distinct from end-user notifications?
592. How do you handle notification content that includes sensitive data (e.g., should an email notification include actual invoice amounts, or just a generic "you have a new invoice")?
593. How would you design the system to support notification grouping by entity (e.g., all notifications about a specific order shown together in a thread)?
594. How do you handle the design of a notification preference center UI that's intuitive across dozens of notification types and multiple channels?
595. How would you design the system to support time-zone-aware scheduling for notifications (e.g., send at 9 AM in the recipient's local time)?
596. How do you handle notification service observability — metrics for send rate, failure rate, latency per channel/provider?
597. How would you design the system to support fallback channels (if push notification fails, fall back to email) with configurable rules?
598. How do you handle GDPR-compliant storage and deletion of notification history containing personal data?
599. How would you design the system to support multi-step notification workflows (e.g., send email, wait 1 day, if not read send SMS)?
600. How do you handle the cost optimization of notification delivery (e.g., choosing cheaper SMS providers based on destination country)?
601. How would you design the system to support notification "snooze" functionality where a user can defer a notification/reminder?
602. How do you handle versioning and rollback of notification templates when a tenant admin makes a change that breaks formatting?
603. How would you design the system architecture so that notification failures never block the core business transaction that triggered them?


---

## 13. Reporting

604. How would you design a reporting architecture that doesn't degrade transactional database performance (e.g., read replicas, CQRS, data warehouse)?
605. How do you handle real-time vs. near-real-time vs. batch reporting requirements, and how do you decide which to use for which reports?
606. How would you design a flexible report builder that allows tenant admins to create custom reports without writing SQL?
607. How do you handle multi-tenant reporting data isolation while still enabling efficient aggregate queries for the report engine?
608. How would you design the system to support drill-down reporting (summary → detail → source transaction) across a normalized schema?
609. How do you handle pre-aggregation/materialized views for expensive reports (e.g., financial statements) and keep them up to date?
610. How would you design the system to support scheduled report generation and delivery (e.g., emailed PDF reports every morning)?
611. How do you handle reporting on data that spans multiple microservices (e.g., a report combining sales, inventory, and accounting data)?
612. How would you design the system to support point-in-time / "as of date" reporting for financial statements?
613. How do you handle reporting performance for tenants with very large datasets (millions of transactions) vs. small tenants, in a shared infrastructure?
614. How would you design the data warehouse / ETL pipeline architecture to sync data from operational microservices into a reporting layer?
615. How do you handle schema evolution in the data warehouse when source microservices change their data models?
616. How would you design the system to support export of reports in multiple formats (PDF, Excel, CSV) with consistent formatting?
617. How do you handle role-based data visibility within reports (e.g., a regional manager sees only their region's data in the same report template)?
618. How would you design the system to support comparative reporting (this period vs. last period, year-over-year) efficiently?
619. How do you handle currency conversion in consolidated reports that aggregate data from multiple currencies?
620. How would you design the system to support dashboards with real-time KPIs (e.g., today's sales) alongside historical trend charts?
621. How do you handle caching strategies for reports — when is it safe to serve a cached report vs. requiring fresh data?
622. How would you design the system to support audit-ready financial reports that can be reproduced exactly even after subsequent data corrections (immutable report snapshots)?
623. How do you handle reporting for hierarchical data (e.g., organizational rollups, product category trees) with arbitrary depth?
624. How would you design the system to support self-service BI tool integration (e.g., exposing a semantic layer for Tableau/Power BI/Looker)?
625. How do you handle the trade-offs between using the operational database directly for reporting vs. building a dedicated OLAP/columnar store?
626. How would you design the system to support "saved reports" with parameters, so users can re-run a report with different date ranges/filters?
627. How do you handle reporting data freshness SLAs (e.g., "dashboard data is at most 15 minutes old") and how do you monitor/enforce them?
628. How would you design the system to support regulatory/statutory report templates that vary by country (e.g., VAT returns, payroll filings)?
629. How do you handle large report exports (e.g., 1 million rows to CSV) without timing out HTTP requests or exhausting memory?
630. How would you design the system to support "report subscriptions" where users get notified/emailed when a report's key metric crosses a threshold?
631. How do you handle reporting access control auditing — tracking who accessed which sensitive reports (e.g., payroll, financial statements)?
632. How would you design the system to support multi-dimensional analysis (OLAP cube-style slicing and dicing) for sales/inventory data?
633. How do you handle the synchronization lag between operational data changes and their reflection in reporting dashboards, and how do you communicate this to users?
634. How would you design the system to support embedded analytics within the application UI (charts/widgets on operational screens) vs. standalone report pages?
635. How do you handle versioning of report definitions so historical reports remain reproducible even as report templates evolve?
636. How would you design the system to support cross-tenant benchmarking reports for the platform owner (e.g., "average inventory turnover across all tenants") while preserving tenant privacy?
637. How do you handle reporting for soft-deleted or archived records — should they appear in historical reports?
638. How would you design the system to support natural language query interfaces for reporting (e.g., "show me sales by region last quarter")?
639. How do you handle the performance of joining data across many tables for complex financial reports (e.g., consolidated P&L with 10+ source tables)?
640. How would you design the system to support incremental data refresh for the reporting layer (only processing changed records since last sync)?
641. How do you handle reporting requirements for multi-entity consolidation with different chart of accounts mappings per entity?
642. How would you design the system to support "what changed" reports (e.g., comparing two versions of a budget or forecast)?
643. How do you handle data quality monitoring for the reporting pipeline (detecting missing data, duplicate records, sync failures)?
644. How would you design the system to support white-labeled report exports (tenant logo, custom headers/footers on PDF reports)?
645. How do you handle reporting for time-series data with different granularities (daily, weekly, monthly, quarterly rollups) efficiently?
646. How would you design the system to support "live" collaborative dashboards where multiple users can adjust filters and see results in real time?
647. How do you handle the architecture decision of build vs. buy for the reporting/BI layer (e.g., custom-built vs. embedding a third-party BI tool)?
648. How would you design the system to support report performance budgets — automatically flagging reports that take too long and need optimization?
649. How do you handle backward compatibility when migrating from one reporting engine/data warehouse to another without disrupting existing scheduled reports?
650. How would you design the system to support anomaly detection within reports (e.g., flagging unusual spikes in expenses automatically)?
651. How do you handle reporting infrastructure costs at scale — how would you balance query performance against the cost of maintaining large materialized views/data warehouses across thousands of tenants?


---

## 14. Kafka Events

652. How would you design event schemas (using Avro/Protobuf/JSON Schema) for core ERP events, and how would you manage schema evolution without breaking consumers?
653. How do you decide on topic structure — one topic per entity type, per service, or per business domain — and what are the trade-offs?
654. How would you design event partitioning keys (e.g., tenant_id vs. entity_id) to balance parallelism with ordering guarantees?
655. How do you handle exactly-once processing semantics in Kafka consumers when the downstream action (e.g., posting a journal entry) must not be duplicated?
656. How would you design the system to handle out-of-order event delivery (e.g., an "OrderUpdated" event arriving before "OrderCreated")?
657. How do you handle schema registry usage to enforce backward/forward compatibility as event schemas evolve over time?
658. How would you design dead-letter queue (DLQ) handling for events that repeatedly fail processing, including alerting and reprocessing workflows?
659. How do you handle consumer group scaling — how would you design consumers to scale horizontally while maintaining per-tenant or per-entity ordering?
660. How would you design the system to support event replay (reprocessing historical events from a topic) for disaster recovery or new consumer onboarding?
661. How do you handle the "dual write" problem — ensuring a database write and a Kafka event publish are atomic (e.g., using the transactional outbox pattern)?
662. How would you design event retention policies per topic, balancing storage costs against replay/audit requirements?
663. How do you handle multi-tenant event streams — should tenants share topics with tenant_id in the payload, or have separate topics/partitions?
664. How would you design the system to monitor consumer lag and alert when a service falls behind processing events?
665. How do you handle versioned events where different consumers might be on different versions of the consuming service during a rolling deployment?
666. How would you design the system to support "fan-out" patterns where one event (e.g., "InvoicePaid") triggers actions in 5+ different services?
667. How do you handle idempotency keys in event payloads so consumers can safely deduplicate even if Kafka delivers a message more than once?
668. How would you design the system to ensure event ordering is preserved for events related to the same entity (e.g., all events for Order #123 processed in order)?
669. How do you handle Kafka cluster sizing and partition count planning for an ERP expecting to scale from 100 to 10,000 tenants?
670. How would you design the system to support event-driven sagas for long-running business transactions spanning multiple services (e.g., order fulfillment saga)?
671. How do you handle compensating transactions when a step in an event-driven saga fails partway through (e.g., inventory reserved but payment fails)?
672. How would you design monitoring/observability for event-driven flows — distributed tracing across producers and consumers via correlation IDs?
673. How do you handle the trade-off between choreography (services react to events independently) vs. orchestration (a central coordinator manages the workflow)?
674. How would you design the system to support "event sourcing" for specific entities (e.g., the GL) where the current state is derived by replaying events?
675. How do you handle backpressure when a downstream consumer (e.g., the notification service) can't keep up with the rate of incoming events?
676. How would you design the system to test event-driven flows end-to-end in CI without requiring a full Kafka cluster (e.g., using testcontainers or embedded Kafka)?
677. How do you handle security for Kafka — encryption in transit/at rest, ACLs per topic, and authentication for producers/consumers?
678. How would you design the system to handle "poison pill" messages that consistently crash a consumer, without blocking the entire partition?
679. How do you handle event schema design for events that need to carry large payloads (e.g., a full invoice with line items) — inline vs. reference-based ("claim check" pattern)?
680. How would you design the system to support multi-region Kafka deployments for global tenants with data residency requirements?
681. How do you handle the migration of event consumers when a topic needs to be split or merged due to scaling requirements?
682. How would you design the system to ensure that events published during a database transaction that later rolls back are never actually sent (avoiding "ghost events")?
683. How do you handle consumer-side filtering vs. producer-side topic segregation when only a subset of consumers care about certain event types within a topic?
684. How would you design an event catalog/documentation system so teams across a large organization understand what events exist and their schemas?
685. How do you handle the operational complexity of running Kafka — would you self-host, use a managed service (Confluent, MSK), and how does this affect your architecture?
686. How would you design the system to support "snapshot + event log" patterns to avoid consumers having to replay the entire history of a topic to get current state?
687. How do you handle GDPR/data deletion requirements for events already published to Kafka (which is typically append-only and immutable)?
688. How would you design the system to ensure that critical business events (e.g., payment confirmations) have stronger delivery guarantees than less critical ones (e.g., analytics events)?
689. How do you handle testing schema compatibility automatically in CI/CD before deploying a new producer or consumer version?
690. How would you design the system to support "event-carried state transfer" so consumers don't need to call back to the source service for additional data?
691. How do you handle the design of consumer checkpointing/offset management to balance between "at-least-once" and risk of reprocessing large amounts of data after a crash?
692. How would you design the system to support cross-service data consistency checks (reconciliation jobs that verify event-driven updates kept services in sync)?
693. How do you handle rate limiting or throttling event production from a service that's generating an unusually high volume of events (e.g., a bulk import)?
694. How would you design the system architecture to decide which operations should be synchronous (REST/gRPC) vs. asynchronous (Kafka events) in the ERP?
695. How do you handle the challenge of debugging a production issue where an event was published but the expected downstream effect didn't happen?
696. How would you design the system to support "delayed" events (e.g., schedule an event to be processed 30 days from now) using Kafka or a complementary scheduler?
697. How do you handle versioning of event-driven sagas themselves — what happens to an in-progress saga when its definition changes mid-flight?
698. How would you design topic naming conventions and ownership models so that as the number of microservices grows into the dozens, the event landscape remains manageable?
699. How do you handle capacity planning for Kafka storage given high-volume audit and event-sourcing topics retained for years?
700. How would you design the system to support local development and testing where developers need realistic event flows without connecting to shared infrastructure?


---

## 15. Microservices

701. How would you decide on service boundaries for an ERP — by business domain (DDD bounded contexts), by data ownership, or by team structure?
702. How do you handle data consistency across services without distributed transactions — what patterns (saga, eventual consistency, outbox) would you apply?
703. How would you design inter-service communication — when to use synchronous REST/gRPC vs. asynchronous messaging, and how do you avoid "distributed monolith" anti-patterns?
704. How do you handle shared reference data (e.g., currency codes, country lists, tax rates) that multiple services need — a shared service, replicated data, or a shared library?
705. How would you design service-to-service authentication and authorization (mTLS, service tokens, mutual trust) in a microservices ERP?
706. How do you handle versioning and backward compatibility for internal service APIs as services evolve independently?
707. How would you design the system to avoid "chatty" microservices that make excessive synchronous calls to each other, degrading latency?
708. How do you handle database-per-service vs. shared database trade-offs, especially for an ERP where many entities are deeply related (e.g., orders, inventory, accounting)?
709. How would you design a service mesh (e.g., Istio/Linkerd) strategy for traffic management, observability, and resilience (circuit breaking, retries) across dozens of services?
710. How do you handle distributed tracing across microservices to debug a slow request that touches 6 different services?
711. How would you design the system to support local development where engineers need to run a subset of services without spinning up the entire platform?
712. How do you handle "shared kernel" concerns — common code/models (e.g., Money, Address, TenantContext) shared across services without creating tight coupling?
713. How would you design the deployment and CI/CD pipeline for dozens of independently deployable microservices while maintaining release coordination when needed?
714. How do you handle backward-incompatible database schema migrations in a service that has zero-downtime deployment requirements?
715. How would you design the system to handle a cascading failure scenario (e.g., the inventory service goes down — what happens to order creation, the journal engine, and notifications)?
716. How do you handle circuit breakers and fallback strategies — what should happen if the pricing service is unavailable when a sales order is being created?
717. How would you design the system's API Gateway to route requests to the correct microservice while handling cross-cutting concerns (auth, rate limiting, logging)?
718. How do you handle the trade-off between having many small microservices (high operational overhead) vs. fewer larger services (less granular scaling/deployment)?
719. How would you design a "strangler fig" migration strategy for incrementally decomposing a monolithic ERP into microservices without a risky big-bang rewrite?
720. How do you handle testing strategies for microservices — unit tests, contract tests (e.g., Pact), integration tests, and end-to-end tests, and how do you balance coverage vs. speed?
721. How would you design the system to support "backend for frontend" (BFF) patterns if the ERP has multiple client types (web, mobile, partner API)?
722. How do you handle service discovery in a dynamic environment where services scale up/down and instances change frequently (Kubernetes-based)?
723. How would you design the data ownership model so that, e.g., the Inventory Service owns inventory data but the Sales Service can still display inventory availability without tight coupling?
724. How do you handle the challenge of "god services" emerging over time (e.g., a "Core" service that accumulates too many responsibilities) and how would you refactor it?
725. How would you design the system to support blue-green or canary deployments for individual microservices with database migrations involved?
726. How do you handle cross-service queries that need to join data from multiple services (e.g., "show me all orders for customers in region X with overdue invoices")?
727. How would you design the system's resilience so a single tenant's heavy load (e.g., a massive bulk import) doesn't degrade performance for other tenants sharing the same service instances?
728. How do you handle configuration management across microservices — centralized config service vs. environment variables vs. config files, and how do you handle per-tenant configuration?
729. How would you design the system to support "feature flags" that can be toggled per-service, per-tenant, or globally, with minimal latency impact?
730. How do you handle service ownership and on-call rotations when a single business process (e.g., order-to-cash) spans services owned by different teams?
731. How would you design health checks and readiness/liveness probes for stateful services (e.g., a service that processes Kafka events) vs. stateless API services?
732. How do you handle the decision of where to place business logic that spans multiple services — should there be an "orchestrator" service, or should logic live in the domain services?
733. How would you design the system to support API contract testing so that a breaking change in Service A is caught before it impacts Service B in production?
734. How do you handle secrets management (database credentials, API keys, encryption keys) across dozens of microservices securely?
735. How would you design the system's logging strategy so logs from all microservices can be correlated and searched centrally (e.g., ELK/Loki with structured logging)?
736. How do you handle the challenge of maintaining consistent domain models/terminology (ubiquitous language) across services owned by different teams?
737. How would you design the system to support graceful degradation — e.g., if the reporting service is down, core transactional operations should still work?
738. How do you handle database migration coordination when a schema change in one service requires corresponding changes in event schemas consumed by other services?
739. How would you design the system's approach to idempotency for all state-changing API endpoints across services (idempotency keys, etc.)?
740. How do you handle the operational complexity of running dozens of microservices — what platform/tooling investments (Kubernetes, observability stack, service mesh) are prerequisites?
741. How would you design the system to support a "read model" service (CQRS query side) that aggregates data from multiple write-side services for fast reads?
742. How do you handle versioning of shared event schemas and client SDKs across many services without creating a release bottleneck?
743. How would you design the system's approach to handling long-running processes (e.g., month-end close, which involves coordinated actions across accounting, inventory, and reporting services)?
744. How do you handle the trade-off of synchronous request/response for user-facing operations (need a quick answer) vs. eventual consistency for back-office operations?
745. How would you design the system to support multi-region active-active deployment of microservices for high availability and low latency for global tenants?
746. How do you handle dependency management — ensuring Service A doesn't have a hard runtime dependency on Service B being available (loose coupling via async messaging)?
747. How would you design the system's API documentation strategy (OpenAPI specs, internal developer portal) so dozens of teams can discover and consume each other's APIs?
748. How do you handle database connection pool exhaustion when many microservice instances each maintain pools to a shared database (or even per-service databases on shared infrastructure)?
749. How would you design a "platform team" structure and tooling (internal developer platform) to support dozens of product teams building microservices consistently?
750. How do you handle the decision of when a new feature warrants a new microservice vs. being added to an existing service (avoiding both over-fragmentation and bloat)?


---

## 16. API Gateway

751. How would you design an API Gateway's responsibilities (routing, auth, rate limiting, request/response transformation) without it becoming a bottleneck or "second monolith"?
752. How do you handle authentication at the gateway (JWT validation) vs. authorization (permission checks) — which happens at the gateway vs. downstream services?
753. How would you design rate limiting at the gateway to support different limits per tenant, per API key, and per endpoint?
754. How do you handle API versioning at the gateway level (URL path versioning, header-based versioning) while routing to the correct backend service version?
755. How would you design the gateway to aggregate responses from multiple microservices into a single response for a client (API composition)?
756. How do you handle gateway-level caching for frequently requested, slow-changing data (e.g., chart of accounts, product catalog)?
757. How would you design the gateway to support request/response transformation (e.g., converting between an external partner's API format and internal service formats)?
758. How do you handle gateway resilience — what happens if a downstream service is slow or down (timeouts, circuit breakers, fallback responses)?
759. How would you design the gateway to support multi-tenant routing where requests are routed to tenant-specific service instances or shards based on tenant_id?
760. How do you handle API gateway logging and metrics to provide visibility into traffic patterns, error rates, and latency per endpoint/tenant?
761. How would you design the gateway to enforce request validation (schema validation) before forwarding to backend services, reducing load from malformed requests?
762. How do you handle CORS, security headers, and other cross-cutting web security concerns centrally at the gateway?
763. How would you design the gateway to support webhook endpoints for external partners, including signature verification and routing to internal event topics?
764. How do you handle gateway configuration management — how do routing rules, rate limits, and policies get updated without downtime?
765. How would you design the gateway to support GraphQL as an alternative to REST for certain client needs, federating queries across microservices?
766. How do you handle API key management for external/partner integrations — issuance, rotation, revocation, and scoping permissions per key?
767. How would you design the gateway to support request throttling that degrades gracefully (e.g., returning cached/stale data) rather than hard failures during traffic spikes?
768. How do you handle the gateway's role in blue-green/canary deployments — routing a percentage of traffic to new service versions?
769. How would you design the gateway to support different SLAs for different tenant tiers (e.g., enterprise tenants get priority routing/higher rate limits)?
770. How do you handle gateway-level idempotency for retried requests (e.g., a client retries a POST due to a timeout — does the gateway help prevent duplicate processing)?
771. How would you design the gateway to support API deprecation — warning headers, sunset dates, and eventually blocking deprecated endpoint usage?
772. How do you handle the gateway's interaction with the audit log service — should the gateway log all requests, or just specific sensitive ones?
773. How would you design the gateway to support request routing based on the geographic origin of the request for multi-region deployments?
774. How do you handle gateway scaling — horizontal scaling of gateway instances and ensuring stateless design (no session affinity issues)?
775. How would you design the gateway to support "shadow traffic" (mirroring production requests to a new service version for testing without affecting users)?
776. How do you handle authentication for different client types through the same gateway — first-party web/mobile apps (session-based or JWT) vs. third-party API consumers (API keys/OAuth)?
777. How would you design the gateway to enforce tenant-level feature entitlements (e.g., blocking access to an API endpoint if the tenant's plan doesn't include that module)?
778. How do you handle gateway-level request/response size limits and timeout configuration differently for different types of operations (e.g., file uploads vs. simple GETs)?
779. How would you design the gateway to support OAuth2 flows for third-party integrations (authorization code grant, client credentials) issuing scoped tokens?
780. How do you handle the gateway's role in DDoS protection — integration with WAF (Web Application Firewall) and rate-based blocking?
781. How would you design the gateway to provide a unified error response format across all microservices, even when underlying services return different error structures?
782. How do you handle gateway configuration for long-polling or streaming endpoints (e.g., real-time notifications, server-sent events) that don't fit typical request/response patterns?
783. How would you design the gateway's health check and failover mechanism if the gateway itself needs to be highly available (active-active gateway instances)?
784. How do you handle backward compatibility at the gateway when a backend service changes its API but external partners depend on the old contract?
785. How would you design the gateway to support request prioritization — e.g., interactive user requests get priority over bulk/batch API calls during high load?
786. How do you handle gateway-level field-level data masking (e.g., masking PII in responses based on the requester's role) without duplicating logic in every service?
787. How would you design the gateway to support multi-protocol support (REST, gRPC, WebSocket) for different microservices behind a unified entry point?
788. How do you handle testing the API gateway configuration — automated tests that verify routing rules, auth enforcement, and rate limits behave as expected?
789. How would you design the gateway to integrate with the approval workflow for exposing new external APIs (e.g., requiring security review before an endpoint goes public)?
790. How do you handle the gateway's role in supporting API monetization for a platform with external developer ecosystem (usage tracking, billing integration)?
791. How would you design the gateway to handle large file uploads — proxying directly vs. issuing pre-signed URLs for direct upload to object storage?
792. How do you handle gateway request tracing — propagating correlation/trace IDs to all downstream services and ensuring they appear in centralized logs?
793. How would you design the gateway configuration to support per-tenant custom domains (e.g., api.customer.com routes to the platform with tenant context)?
794. How do you handle gateway-level retries for idempotent operations (GET requests) vs. avoiding retries for non-idempotent operations (POST)?
795. How would you design the gateway to support a developer sandbox/test mode where requests hit mock or test endpoints instead of production services?
796. How do you handle the operational ownership of the API gateway — is it owned by a platform team, and how do product teams register new routes/services?
797. How would you design the gateway to enforce consistent pagination, filtering, and sorting conventions across all underlying microservice APIs?
798. How do you handle gateway downtime scenarios — what's your disaster recovery plan if the primary gateway cluster fails entirely?
799. How would you design the gateway to support request signing/verification for highly sensitive operations (e.g., payment initiation) beyond standard JWT auth?
800. How do you handle the gateway's role in API analytics — providing tenant admins visibility into their own API usage patterns and quota consumption?


---

## 17. Upload Service

801. How would you design a centralized file upload service that other microservices use for handling attachments (invoices, contracts, profile images, import files)?
802. How do you handle large file uploads efficiently — direct-to-client upload via pre-signed URLs vs. proxying through your servers?
803. How would you design the system to support resumable/chunked uploads for large files (e.g., a 500MB data export being uploaded by a tenant)?
804. How do you handle virus/malware scanning of uploaded files before they're made available to other users or services?
805. How would you design the system to validate file types and content (not just trusting file extensions) to prevent malicious uploads?
806. How do you handle multi-tenant file storage organization in object storage (e.g., S3 bucket structure, prefixes per tenant) for isolation and cost tracking?
807. How would you design the system to support file versioning (e.g., a contract document that's been revised multiple times)?
808. How do you handle access control for uploaded files — generating time-limited, signed URLs for download vs. proxying access checks?
809. How would you design the system to support image processing pipelines (thumbnails, resizing, format conversion) triggered asynchronously after upload?
810. How do you handle file metadata storage (filename, size, content type, uploader, tenant, associated entity) — in the upload service's own DB or in the consuming service's DB?
811. How would you design the system to support bulk file imports (e.g., CSV/Excel upload for bulk product creation) including validation, error reporting, and partial success handling?
812. How do you handle storage cost optimization — lifecycle policies to move infrequently accessed files to cheaper storage tiers (e.g., S3 Glacier)?
813. How would you design the system to support document templates (e.g., invoice PDF templates) that are rendered dynamically with tenant data?
814. How do you handle file upload failures and retries from the client side, especially on unreliable network connections (mobile users)?
815. How would you design the system to enforce per-tenant storage quotas and alert/block uploads when limits are reached?
816. How do you handle the security implications of allowing users to upload files that are later processed (e.g., parsing an uploaded Excel file) — sandboxing and resource limits?
817. How would you design the system to support attaching multiple files to a single business entity (e.g., a purchase order with PO document, vendor quote, and approval email attached)?
818. How do you handle file deduplication — detecting when the same file content is uploaded multiple times and storing it only once (content-addressable storage)?
819. How would you design the system to support generating downloadable reports/exports asynchronously (e.g., a large PDF or Excel report generated as a background job, with the upload service storing the result)?
820. How do you handle data residency requirements for uploaded files (e.g., EU tenant files must be stored in EU-region object storage)?
821. How would you design the system to support OCR/text extraction from uploaded documents (e.g., scanned vendor invoices) as part of an async processing pipeline?
822. How do you handle the audit trail for file access — logging who downloaded/viewed a sensitive document and when?
823. How would you design the system to support file preview generation (e.g., generating a preview image for PDFs/Office documents without requiring the client to download the full file)?
824. How do you handle encryption of files at rest, and how would you support tenant-specific encryption keys (BYOK) for highly regulated industries?
825. How would you design the upload service's API to be used consistently by dozens of other microservices without each one reimplementing upload logic?
826. How do you handle orphaned file cleanup — files that were uploaded but never associated with a final entity (e.g., user uploaded a file then abandoned the form)?
827. How would you design the system to support collaborative document editing or annotation on uploaded files (e.g., commenting on a contract PDF)?
828. How do you handle file upload rate limiting and abuse prevention (e.g., a malicious user repeatedly uploading huge files to exhaust storage)?
829. How would you design the system to support exporting a tenant's entire file repository (e.g., for GDPR data portability requests or tenant offboarding)?
830. How do you handle the trade-off between storing files in a general-purpose object store (S3) vs. a specialized document management system?

831. How would you design the system to support automatic expiration/deletion of temporary files (e.g., export files older than 7 days)?
832. How do you handle concurrent uploads of related files (e.g., bulk import with multiple attachments) and ensure consistency of the associated records?
833. How would you design the upload service to provide progress tracking for large uploads/downloads to the client UI?
834. How do you handle the scenario where an uploaded file needs to be processed by multiple downstream services (e.g., an uploaded invoice triggers both OCR extraction and archival)?
835. How would you design the system to support watermarking or stamping of generated documents (e.g., "DRAFT" watermark on unapproved invoices)?
836. How do you handle storage migration (e.g., moving from one cloud provider's object storage to another) with minimal downtime and without breaking existing file URLs?
837. How would you design the system to support file-level retention policies tied to compliance requirements (e.g., financial documents retained for 7 years, then auto-deleted)?
838. How do you handle the upload service's role in disaster recovery — backup strategy for object storage and metadata databases?
839. How would you design the system to support generating signed, time-limited download links that can be shared externally (e.g., sharing an invoice PDF with a customer) with revocation capability?
840. How do you handle monitoring and alerting for the upload service (upload success/failure rates, storage growth, virus scan failures)?
841. How would you design the system to support converting uploaded documents between formats (e.g., DOCX to PDF) as part of the processing pipeline?
842. How do you handle the upload service's integration with the audit log and notification services (e.g., notify approvers when a contract document is uploaded)?
843. How would you design the system to support multi-part form submissions that combine structured data (JSON) and file uploads in a single atomic operation?
844. How do you handle testing the upload service — mocking object storage, virus scanning, and async processing pipelines in CI/CD?
845. How would you design the system to support tenant-configurable file naming/organization conventions for exported documents (e.g., custom invoice numbering in filenames)?


---

## 18. DevOps

846. How would you design the CI/CD pipeline for a microservices ERP with dozens of services, balancing speed, safety, and developer experience?
847. How do you handle infrastructure as code (Terraform/Pulumi) for managing multi-tenant cloud infrastructure across environments (dev, staging, production)?
848. How would you design a Kubernetes cluster topology for the ERP — namespace-per-environment, namespace-per-tenant (for large enterprise tenants), or shared namespaces?
849. How do you handle zero-downtime database migrations as part of the deployment pipeline, especially for services with high uptime requirements?
850. How would you design the observability stack (metrics, logs, traces) for a system with dozens of microservices — what tools and conventions would you standardize?
851. How do you handle secrets management in CI/CD and runtime environments (Vault, AWS Secrets Manager, sealed secrets in Kubernetes)?
852. How would you design auto-scaling policies for services with variable load patterns (e.g., the reporting service spikes during month-end close)?
853. How do you handle multi-environment configuration management (dev/staging/prod) while keeping configuration drift to a minimum?
854. How would you design a disaster recovery strategy with defined RTO/RPO targets for an ERP handling financial data?
855. How do you handle blue-green or canary deployment strategies for stateful services with database dependencies?
856. How would you design the system's approach to database backup, point-in-time recovery, and regular restore testing?
857. How do you handle cost monitoring and optimization across a multi-tenant cloud infrastructure (tagging strategy, showback/chargeback per tenant)?
858. How would you design the on-call/incident response process for a platform with financial implications (e.g., a journal engine outage during month-end close)?
859. How do you handle container image security — vulnerability scanning, base image management, and patching cadence across dozens of services?
860. How would you design the system's load testing strategy to ensure it can handle peak loads (e.g., Black Friday for an e-commerce-integrated ERP)?
861. How do you handle database connection management at scale in Kubernetes (e.g., PgBouncer/connection pooling sidecars) when many pods need DB access?
862. How would you design the system's approach to feature flag management across environments, including who can toggle flags in production?
863. How do you handle log retention and cost management for a system generating massive volumes of structured logs across microservices?
864. How would you design a GitOps workflow (e.g., ArgoCD/Flux) for managing Kubernetes deployments declaratively across environments?
865. How do you handle the rollback strategy when a bad deployment is detected — automated rollback triggers based on error rate/latency thresholds?
866. How would you design network policies and segmentation in Kubernetes to enforce that, e.g., the reporting service can't directly access the payment service's database?
867. How do you handle dependency management and base image updates across dozens of services to avoid security drift while minimizing breaking changes?
868. How would you design the deployment pipeline to support database schema migrations that need to be backward-compatible during rolling deployments (old and new code running simultaneously)?
869. How do you handle multi-region deployment automation, ensuring configuration and infrastructure stay consistent across regions?
870. How would you design the system's chaos engineering practice — what failure scenarios would you test (e.g., killing the Kafka broker, simulating database failover)?
871. How do you handle capacity planning for an ERP platform expecting to grow from hundreds to tens of thousands of tenants over the next two years?
872. How would you design alerting thresholds and escalation policies to avoid alert fatigue while ensuring critical issues (e.g., failed journal postings) are never missed?
873. How do you handle the build pipeline for monorepo vs. polyrepo setups when managing dozens of microservices?
874. How would you design the system's approach to environment parity — ensuring staging closely mirrors production to catch issues before release?
875. How do you handle database migration rollback strategies when a migration partially succeeds in production?
876. How would you design the deployment process for shared libraries/SDKs used across many services, ensuring updates don't require simultaneous redeployment of everything?
877. How do you handle compliance automation — e.g., automated checks in CI/CD that enforce encryption, access control, and audit logging standards before code can be merged?
878. How would you design the system's approach to managing Kafka topic provisioning and configuration as part of infrastructure as code?
879. How do you handle the operational runbook documentation for common incidents (e.g., "journal engine consumer lag is increasing — what do you do")?
880. How would you design the system's approach to database read replica management and routing read-heavy reporting queries away from the primary?
881. How do you handle dependency/version management for client SDKs that external partners use to integrate with your API (backward compatibility commitments)?
882. How would you design the system's approach to secrets rotation (database passwords, API keys, encryption keys) without causing service disruptions?
883. How do you handle the trade-off between running databases as managed cloud services (RDS/Cloud SQL) vs. self-managed on Kubernetes?
884. How would you design a "preview environment" system where each pull request gets a temporary, isolated deployment for testing?
885. How do you handle monitoring of business-level SLIs/SLOs (e.g., "99.9% of journal postings complete within 5 seconds") in addition to infrastructure metrics?
886. How would you design the system's approach to handling configuration secrets for hundreds of tenant-specific integrations (each tenant's SMTP credentials, payment gateway keys, etc.)?
887. How do you handle infrastructure cost allocation when shared services (Kafka, databases) serve all tenants — how do you attribute cost per tenant for chargeback?
888. How would you design the deployment strategy for the journal engine specifically, given its criticality — does it get special deployment windows, extra testing, or staged rollouts?
889. How do you handle the security review/penetration testing cadence for a platform handling financial data, and how is this integrated into the release cycle?
890. How would you design the system's documentation strategy (architecture decision records, runbooks, API docs) so a growing engineering team stays aligned?
891. How do you handle managing database migrations across hundreds/thousands of tenant schemas in a shared-schema-per-tenant model during deployments?
892. How would you design your approach to "everything as code" — not just infrastructure, but also alerting rules, dashboards, and access policies?
893. How do you handle the build vs. buy decision for observability tooling (Datadog/New Relic vs. self-hosted Prometheus/Grafana/Loki stack) at different stages of company growth?
894. How would you design the system's incident postmortem process to ensure learnings translate into concrete architectural or process improvements?
895. How do you handle scaling the data layer — when do you introduce sharding, read replicas, or a move to a distributed database, and how do you execute that migration with minimal downtime?


---

## 19. Compliance

896. How would you design the system to support SOC 2 Type II compliance requirements (access controls, change management, monitoring) across a microservices architecture?
897. How do you handle GDPR "right to be forgotten" requests when a customer's data is spread across dozens of microservices, databases, caches, and backups?
898. How would you design the system to support data residency requirements where certain tenants' data must never leave a specific geographic region?
899. How do you handle PCI-DSS compliance if the ERP processes or stores payment card data — what architectural patterns minimize PCI scope (e.g., tokenization, using a payment processor)?
900. How would you design the system to support SOX (Sarbanes-Oxley) compliance requirements for financial controls, including segregation of duties and change management for the journal engine?
901. How do you handle data encryption requirements at rest and in transit across all services, databases, message queues, and object storage?
902. How would you design the system to support country-specific e-invoicing mandates (e.g., real-time invoice reporting to tax authorities)?
903. How do you handle compliance with data localization laws (e.g., Russia, China, India) that require certain data types to be stored within national borders?
904. How would you design the system to generate audit-ready evidence for compliance audits (e.g., proof that access reviews were conducted quarterly)?
905. How do you handle the "shared responsibility model" when running on cloud infrastructure — what compliance controls are the cloud provider's responsibility vs. yours?
906. How would you design the system to support ISO 27001 information security management requirements, including risk assessments and the statement of applicability?
907. How do you handle compliance with industry-specific regulations (e.g., HIPAA if the ERP is used in healthcare, or FDA 21 CFR Part 11 for pharma/life sciences inventory)?
908. How would you design the system to support consent management for data processing, tracking what a user/tenant has consented to and when?
909. How do you handle data minimization principles — designing services to collect and retain only the data necessary for their function?
910. How would you design the system to support "data subject access requests" (DSARs) where a user can request a copy of all personal data held about them?
911. How do you handle compliance with anti-money laundering (AML) and know-your-customer (KYC) requirements if the ERP includes payment processing features?
912. How would you design the system to support electronic signature compliance (eIDAS, ESIGN Act) for approval workflows and contracts?
913. How do you handle the architectural implications of "privacy by design" — embedding privacy considerations into the design of new features from the start?
914. How would you design the system to support tax compliance across multiple jurisdictions (different VAT/GST rates, filing requirements, digital reporting formats like SAF-T)?
915. How do you handle compliance documentation for third-party vendors/sub-processors (e.g., maintaining a list of sub-processors for GDPR Article 28 compliance)?
916. How would you design the system to support data breach notification requirements — detecting, assessing, and notifying affected parties within mandated timeframes (e.g., 72 hours under GDPR)?
917. How do you handle compliance with accessibility standards (WCAG) for the ERP's user interfaces, and how would this affect frontend architecture decisions?
918. How would you design the system to support record retention schedules that vary by document type and jurisdiction (e.g., 7 years for tax records, indefinite for certain legal documents)?
919. How do you handle compliance audits of access logs to prove that only authorized personnel accessed sensitive financial or personal data?
920. How would you design the system to support "compliance as code" — encoding regulatory requirements as automated checks in CI/CD and runtime monitoring?
921. How do you handle export control compliance (e.g., restrictions on providing software/services to sanctioned countries or entities)?
922. How would you design the system to support whistleblower/anonymous reporting channels required by some corporate governance regulations, while maintaining audit trails?
923. How do you handle compliance with electronic record-keeping requirements that mandate records be unalterable once finalized (e.g., certain tax authorities require immutable invoice records)?
924. How would you design the system to support periodic access recertification — requiring managers to periodically review and confirm their team's system access is still appropriate?
925. How do you handle compliance with industry data standards (e.g., EDI for B2B transactions, specific formats required by trading partners)?
926. How would you design the system to support a compliance dashboard for tenant admins showing their organization's compliance posture (e.g., MFA adoption, access review status)?
927. How do you handle the challenge of maintaining compliance across a rapidly evolving regulatory landscape (e.g., new e-invoicing mandates rolling out country by country)?
928. How would you design the system to support "legal hold" functionality that prevents deletion of specific records/data subject to litigation, overriding normal retention policies?
929. How do you handle compliance considerations when using AI/ML features within the ERP (e.g., automated approval suggestions) — explainability, bias, and regulatory scrutiny (e.g., EU AI Act)?
930. How would you design the system to support vendor risk management — assessing and documenting the security/compliance posture of third-party integrations and sub-processors?
931. How do you handle compliance with employment law requirements if the ERP includes HR/payroll features (data protection for employee records, right to access personnel files)?
932. How would you design the system's change management process to satisfy compliance requirements for financial systems (e.g., all production changes require approval, testing evidence, and rollback plans)?
933. How do you handle compliance with industry-specific chart of accounts or reporting standards mandated by regulators (e.g., insurance statutory accounting, government fund accounting)?
934. How would you design the system to support automated compliance reporting for things like beneficial ownership disclosures or related-party transaction reporting?
935. How do you handle the architectural decisions needed to support "bring your own encryption key" (BYOK) for tenants with strict data sovereignty requirements?
936. How would you design the system to support compliance with electronic data interchange security standards when exchanging data with government tax portals?
937. How do you handle compliance training and awareness tracking as part of the platform (e.g., tracking that all users with financial access have completed security training)?
938. How would you design the system to support a "compliance calendar" feature that tracks upcoming regulatory deadlines (tax filings, audits, certifications) per tenant/jurisdiction?
939. How do you handle the impact of compliance requirements on data deletion in event-sourced or append-only systems (Kafka topics, immutable ledgers) where "deletion" conflicts with "immutability"?
940. How would you design the system to support multi-jurisdictional employment classification compliance (e.g., contractor vs. employee rules) if procurement includes services from individuals?
941. How do you handle compliance with environmental, social, and governance (ESG) reporting requirements that are becoming mandatory in some jurisdictions (e.g., EU CSRD)?
942. How would you design the system to support "four-eyes principle" enforcement (two-person authorization) for the most sensitive operations, distinct from standard approval workflows?
943. How do you handle the documentation and evidence-gathering burden of compliance — how would you design systems to automatically generate evidence artifacts rather than relying on manual collection during audits?
944. How would you design the system to support data classification (public, internal, confidential, restricted) and apply different handling rules automatically based on classification?
945. How do you handle compliance with industry-specific data retention minimums vs. the user's "right to deletion" — how do you resolve these conflicting requirements in your data model?
946. How would you design the system to support cross-border data transfer mechanisms (e.g., Standard Contractual Clauses) when a tenant's data needs to be accessed by support staff in a different region?
947. How do you handle compliance considerations for backup data — should backups be subject to the same retention/deletion rules as production data, and how do you implement that practically?
948. How would you design the system to support an internal "compliance API" that other services query to determine applicable rules (e.g., "what's the retention period for this document type in this tenant's jurisdiction?")?
949. How do you handle the operational challenge of demonstrating compliance to multiple different auditors (financial auditors, security auditors, tax authorities) with potentially overlapping but distinct evidence requirements?
950. How would you design the system's approach to third-party penetration testing and vulnerability disclosure programs as part of an ongoing compliance posture?
951. How do you handle compliance requirements around encryption key management — key rotation schedules, hardware security modules (HSMs), and key access auditing?
952. How would you design the system to support tenant-specific compliance configurations (e.g., one tenant needs HIPAA controls, another needs only standard SOC 2) without maintaining separate codebases?
953. How do you handle the compliance implications of using third-party AI services (e.g., sending data to an external LLM API for document processing) — data processing agreements and data flow mapping?
954. How would you design the system to support "purpose limitation" — ensuring data collected for one purpose (e.g., billing) isn't used for unrelated purposes (e.g., marketing) without proper consent?
955. How do you handle compliance with record immutability requirements for audit logs while also needing to redact personal data from those logs for privacy compliance — how do you reconcile these?
956. How would you design a unified compliance framework that maps specific regulations (GDPR, SOC2, PCI-DSS, SOX) to concrete technical controls implemented across the platform, avoiding duplicated effort?


---

## 20. Cross-Cutting & Scenario-Based System Design Questions

957. Design an end-to-end architecture for "Order-to-Cash": a sales order is placed, inventory is reserved, goods are shipped, an invoice is generated, payment is received, and the GL is updated — across which services do these steps occur, and what events tie them together?
958. Design an end-to-end architecture for "Procure-to-Pay": a purchase requisition is approved, a PO is sent to a vendor, goods are received, a three-way match occurs, and the vendor is paid — map this across services and events.
959. Walk through what happens, end-to-end, when a tenant's finance admin closes the monthly accounting period — which services are notified, what validations occur, and what could block the close?
960. Design the system response when a Kafka consumer for the journal engine has been down for 6 hours and 50,000 events have backed up — how do you safely catch up without overwhelming the database or duplicating postings?
961. A customer reports that their inventory valuation report doesn't match their GL inventory balance — walk through how you'd architect the system to make this discrepancy easy to diagnose.
962. Design the system to support a large enterprise customer's requirement to have a dedicated, isolated environment (database, services, Kafka topics) while still receiving platform updates alongside other tenants.
963. A new regulation requires real-time invoice reporting to a government tax authority within 1 hour of invoice creation — how would you architect this without disrupting existing invoicing flows?
964. Design the data flow and architecture for a "month-end close" automation feature that runs dozens of checks (unreconciled accounts, missing approvals, open POs) and produces a readiness report for the controller.
965. How would you architect the system to support a customer migrating from a legacy on-premise ERP, including historical data import, parallel-run validation, and cutover strategy?
966. Design the architecture for handling a "Black Friday" scenario where order volume spikes 50x for e-commerce-integrated tenants — which services need to scale, and how do you protect the journal engine and inventory service from being overwhelmed?
967. A security audit finds that a former employee's account still has access three months after termination — how would you redesign the system to prevent this (architecture + process)?
968. Design the system's response to a scenario where two services have inconsistent views of an order's status due to a missed Kafka event — how do you detect and reconcile this?
969. How would you design a "tenant data export" feature that produces a complete, portable export of a tenant's data (all modules) for migration to another system, given the data spans dozens of microservices?
970. Walk through the architecture of how a single "Create Sales Order" API call from the UI results in inventory reservation, pricing calculation, tax calculation, credit check, and order confirmation — sequential calls, parallel calls, or events?
971. Design the system to detect and prevent a scenario where a bug causes thousands of duplicate journal entries to be posted — what safeguards (idempotency, validation, monitoring) would catch this before it corrupts financial statements?
972. How would you architect a "sandbox/demo" mode for prospective customers to explore the ERP with realistic sample data, without that data ever mixing with real tenant data?
973. Design the approach for rolling out a breaking change to the journal engine's posting rules across thousands of tenants with different go-live schedules.
974. A tenant reports that approval emails aren't being received — walk through how you'd architect observability to quickly pinpoint whether the issue is in the workflow engine, notification service, email provider, or tenant configuration.
975. Design the system architecture to support "what if we acquired a competitor and need to merge their tenant's data into ours" — what are the major challenges across CoA, customer records, inventory, and historical transactions?
976. How would you design the system so that a catastrophic failure of the primary database region triggers automated failover to a secondary region within minutes, with minimal data loss for financial transactions?
977. Design a feature where tenant admins can simulate the impact of a proposed Chart of Accounts restructuring on historical reports before applying it — what services/data would this touch?
978. Walk through how you'd design the system to support a phased multi-region rollout (e.g., launch in US, then EU, then APAC) while sharing a common codebase and event schemas.
979. Design the architecture for an "AI-assisted" feature that suggests journal entry classifications based on historical patterns — how would this integrate with the existing journal engine without compromising audit requirements?
980. How would you architect a system to support real-time fraud detection on procurement transactions (e.g., flagging unusual vendor payment patterns) using the existing event stream?
981. Design the data architecture to support a "consolidated group view" dashboard for a holding company with 20 subsidiaries, each running as a separate tenant, with different currencies and CoAs.
982. Walk through how a single bug in the inventory valuation service that miscalculates costs for 3 days would be detected, contained, and remediated across all affected tenants and their financial reports.
983. Design the system's approach to supporting a tenant who wants to integrate their existing HR system, e-commerce platform, and CRM with the ERP via APIs and events — what's the integration architecture?
984. How would you design the system to allow a tenant to "undo" an accidental bulk import of 10,000 incorrect sales orders, including all downstream effects (inventory reservations, GL postings, notifications sent)?
985. Design the architecture for supporting offline-first mobile apps for warehouse staff that sync inventory transactions when connectivity is restored, including conflict resolution.
986. Walk through the end-to-end architecture for handling a customer's annual financial audit — what data/reports/logs would the system need to produce, and from how many different services would this data be pulled?
987. Design a system for "what changed and why" — given a financial discrepancy discovered 6 months later, how would you trace back through events, audit logs, and journal entries to find the root cause?
988. How would you architect the platform to support gradual deprecation of an old microservice (e.g., replacing the legacy notification service with a new one) without downtime or data loss?
989. Design the architecture to support a tenant requesting that all their data be permanently and verifiably deleted within 30 days (including backups), while the platform must retain certain records for legal compliance — how do you reconcile this?
990. Walk through how you'd design load testing for the entire order-to-cash flow, including realistic Kafka event volumes, to validate the system can handle a tenant 10x its current size.
991. Design the system's approach to onboarding a new large enterprise customer who needs custom workflows, custom fields, and a custom approval hierarchy — without forking the core platform codebase.
992. How would you architect a "dry run" mode for an entire month-end close process, allowing the finance team to preview all GL postings, reports, and locked periods before committing?
993. Design the system's response to discovering that an API key with broad permissions was accidentally committed to a public GitHub repository — what's the incident response architecture (detection, revocation, impact assessment)?
994. Walk through the architecture for supporting real-time currency exchange rate updates that affect open orders, inventory valuations, and financial reports across all tenants simultaneously.
995. Design a system for "data lineage" tracking — given any number on a financial report, being able to trace it back through every transformation, aggregation, and source transaction across the architecture.
996. How would you architect the platform to support a "preview" of a new feature for select beta tenants, including feature-flagged UI, API behavior, and event schema changes, without affecting other tenants?
997. Design the system's approach to handling a scenario where a tenant's data grows so large (e.g., 500 million transactions) that standard queries become too slow — what architectural changes would you make?
998. Walk through how you'd design the system to support real-time collaborative editing of a budget spreadsheet by multiple users, with changes reflected in reporting dashboards.
999. Design the architecture for a "platform status page" that gives tenants visibility into the health of each module (accounting, inventory, sales) independently, based on real service health data.
1000. How would you design the overall system architecture (services, data stores, event backbone, gateway, and supporting infrastructure) for this ERP from scratch, given everything covered above — sketch the high-level component diagram and justify your key decisions?
1001. Design a comprehensive incident response and postmortem process for a scenario where a production bug caused incorrect tax calculations on 50,000 invoices over two weeks — covering detection, remediation, customer communication, financial correction, and prevention.

