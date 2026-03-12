# TAMACORE — Legal Entity Owner & Address Table (RanchLink Early Target Pipeline)

**Source pipeline:** RanchLink Early Target Pipeline (Central Texas).  
**Purpose:** Owner/director name and mailing address for each legal entity (demo mailing, CRM).  
**Lookup rule:** All data is **public access**: search **Texas Comptroller** [Franchise Tax Account Status](https://comptroller.texas.gov/taxes/franchise/account-status/search) by entity name, then **Texas SOS** [SOSDirect](https://direct.sos.state.tx.us) if needed. Use **name-variant skill** when exact name returns no result (see `lib/tamacore/entity-name-variants.ts` and TAMACORE.md).  
**Note:** TAMACORE is a separate tool that feeds RanchLink with customers; it lives in this repo under `docs/`, `apps/web/app/api/tamacore/`, and `lib/tamacore/` without touching Factory or the main product.

---

## Table: Legal Entity → Owner Name → Owner / Mailing Address

| # | Legal Name | Owner / Director Name | Owner (or Mailing) Address | Source / Notes |
|---|------------|------------------------|----------------------------|----------------|
| 1 | Smith Genetics LLC | Timothy J. Smith | P.O. BOX 330, GIDDINGS, TX 78942 | TX Comptroller / PIR. Prototype sent. |
| 2 | Braham Country Genetics LLC | Brandon Cutrer, Rachel Cutrer | 1730 North Richmond Road, Wharton, TX 77488 | Pipeline had "Brahman Country Beef LLC" (Llano); legal name & HQ in Wharton. Verify TX Comptroller/SOS. |
| 3 | V8 Ranch Inc | Mollie Williams (owner); Jim Williams (contact) | 2121 FM 2817, Wharton, TX 77488 (or P.O. Box 338, Boling, TX 77420) | Chamber/ranch; verify TX Comptroller/SOS. |
| 4 | BRC Ranch LLC | Brandon Cutrer, Rachel Cutrer | Boling / Wharton area (BRC Ranch); Refugio Wagyu may be different entity | Pipeline lists Refugio Wagyu; BRC Ranch LLC in records is Cutrer/Boling Brahman. Confirm Refugio entity name in TX SOS. |
| 5 | McClaren Farms LLC | Bob McClaren | Cameron, TX (Little River area); exact street from state registry | 44 Farms same area; verify TX Comptroller/SOS for official mailing address. |
| 6 | Mill-King Market & Creamery LLC | Craig Miller | 1410 Coyote Lane, McGregor, TX 76657 | Chamber/website; verify TX Comptroller/SOS. |
| 7 | Volleman's Family Farm LLC | Frank Volleman, Annette Volleman | 15400 Hwy 36, Gustine, TX 76455 | Website; verify TX Comptroller/SOS. |
| 8 | Stryk Jersey Farm LLC | Bob Stryk, Darlene Stryk | 7202 Kreneck-Stryk Rd, Schulenburg, TX 78956 (cheese shop: 629 Krenek Stryk Rd) | Farm/directory; verify TX Comptroller/SOS. |
| 9 | Richardson Farms LLC | Jim Richardson, Kay Richardson | 3126 County Road 412, Rockdale, TX 76567 | Richardson Farms website; verify TX Comptroller/SOS. |
| 10 | Strait Ranch Company LLC | Y.N. Strait family (e.g. Yancey Strait) | Streetman, TX; Encinal, TX 78019; contact 972.841.0989 / 830.317.3310 | Strait Ranches (Santa Gertrudis); get exact mailing from TX SOS/Comptroller. |
| 11 | JB Ranch LLC | *(from Comptroller/SOS)* | *(from Comptroller/SOS)* | **Comptroller/SOS lookup:** Search [TX Comptroller](https://comptroller.texas.gov/taxes/franchise/account-status/search) and [TX SOS](https://direct.sos.state.tx.us) by: "JB Ranch LLC"; if no result, try "JB Ranch I LLC", "JB Ranch", "JB6 LLC" (La Grange — different entity). Capture registered agent / PIR owner and address. |
| 12 | 4C Ranch LLC | *(from Comptroller/SOS)* | *(from Comptroller/SOS)* | **Comptroller/SOS lookup:** Search [TX Comptroller](https://comptroller.texas.gov/taxes/franchise/account-status/search) and [TX SOS](https://direct.sos.state.tx.us) by: "4C Ranch LLC"; if no result, try "4C's Ranch LLC", "4Cs Ranch LLC", "4C Ranch". Capture registered agent / PIR owner and address. |

---

## CSV (for mail merge or CRM)

```csv
#,Legal Name,Owner/Director Name,Owner or Mailing Address,Notes
1,Smith Genetics LLC,Timothy J. Smith,"P.O. BOX 330, GIDDINGS, TX 78942",TX Comptroller; prototype sent
2,Braham Country Genetics LLC,"Brandon Cutrer, Rachel Cutrer","1730 North Richmond Road, Wharton, TX 77488",Verify TX SOS; pipeline had Brahman Country Beef LLC Llano
3,V8 Ranch Inc,"Mollie Williams, Jim Williams","2121 FM 2817, Wharton, TX 77488",Verify TX Comptroller/SOS
4,BRC Ranch LLC,"Brandon Cutrer, Rachel Cutrer","Boling/Wharton TX; confirm Refugio Wagyu entity",Different entity possible for Refugio
5,McClaren Farms LLC,Bob McClaren,"Cameron, TX (exact from state registry)",Verify TX Comptroller/SOS
6,Mill-King Market & Creamery LLC,Craig Miller,"1410 Coyote Lane, McGregor, TX 76657",Verify state
7,Volleman's Family Farm LLC,"Frank Volleman, Annette Volleman","15400 Hwy 36, Gustine, TX 76455",Verify state
8,Stryk Jersey Farm LLC,"Bob Stryk, Darlene Stryk","7202 Kreneck-Stryk Rd, Schulenburg, TX 78956",Verify state
9,Richardson Farms LLC,"Jim Richardson, Kay Richardson","3126 County Road 412, Rockdale, TX 76567",Verify state
10,Strait Ranch Company LLC,Y.N. Strait family,"Streetman/Encinal TX; get exact from state",Strait Ranches; verify TX SOS
11,JB Ranch LLC,(from Comptroller/SOS),(from Comptroller/SOS),Run Comptroller + SOS search; try "JB Ranch LLC", "JB Ranch I LLC", "JB Ranch", "JB6 LLC"
12,4C Ranch LLC,(from Comptroller/SOS),(from Comptroller/SOS),Run Comptroller + SOS search; try "4C Ranch LLC", "4C's Ranch LLC", "4Cs Ranch LLC"
```

---

## Official lookup (public data)

- **Texas Comptroller (Franchise Tax):** https://comptroller.texas.gov/taxes/franchise/account-status/search — search by Entity Name (2–50 chars); capture mailing address, registered agent, PIR owner/address.
- **Texas SOS (SOSDirect):** https://direct.sos.state.tx.us — business entity search by name; capture registered agent and registered office.

For **#11 (JB Ranch LLC)** and **#12 (4C Ranch LLC)**: run the Comptroller search first, then SOS if needed. Use the name-variant skill: try the exact pipeline name, then variants listed in the table. The owner name and address are in the public record; fill the table from the search result.

---

*Generated for TAMACORE pipeline; do not use for RanchLink product logic or Factory.*
