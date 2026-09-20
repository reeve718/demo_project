<script setup lang="ts">
/**
 * About page. Renders an overview of the project, the data source
 * (CSDI Portal), the full CSDI Terms of Use, and the project disclaimer.
 *
 * The terms text is embedded verbatim from the CSDI Portal so it can be
 * read in-app without leaving the project. The authoritative version
 * lives at https://www.csdi.gov.hk/ — verify against the live portal
 * before any reuse.
 */
</script>

<template>
  <main class="page">
    <header class="header">
      <h1>About GeoCatalog Explorer</h1>
      <p class="subtitle">
        A personal learning and demo project that renders open Hong Kong
        government geospatial data from the CSDI Portal.
      </p>
    </header>

    <section class="card">
      <h2>What this is</h2>
      <p>
        GeoCatalog Explorer is a personal technical learning and demo
        project that demonstrates how to build a small, modern full-stack
        GIS application. It pairs a Vue 3 + Vite + TypeScript frontend
        with a NestJS REST API backed by PostgreSQL with the PostGIS
        spatial extension.
      </p>
      <p>
        The dataset browser, keyword search, theme filter, dataset detail
        page, multi-layer map explorer, feature click interactions, and
        bbox-driven feature queries are all intended as a working
        demonstration of how the pieces talk to each other — not as a
        production system.
      </p>
    </section>

    <section class="card">
      <h2>Data source — CSDI Portal</h2>
      <p>
        All datasets bundled with this project are sourced from the
        <a href="https://www.csdi.gov.hk/" target="_blank" rel="noopener noreferrer">Common Spatial Data Infrastructure (CSDI) Portal</a>,
        a one-stop geospatial information service provided by the
        <strong>Development Bureau of the Government of the Hong Kong
        Special Administrative Region</strong> (the "Government"). Each
        dataset's <code>publisher</code> in the catalogue identifies the
        relevant organisation that supplied the records (for example,
        the Hong Kong Fire Services Department or the Education Bureau).
      </p>
      <p>
        The Data are downloaded once and bundled as GeoJSON FeatureCollections
        under <code>db/seed/datasets/</code>; the application reads them
        from its own database, not from the CSDI Portal at runtime.
      </p>
      <p>
        Source: <a href="https://www.csdi.gov.hk/" target="_blank" rel="noopener noreferrer">https://www.csdi.gov.hk/</a>
      </p>
    </section>

    <section class="card">
      <h2>Acknowledgement and intellectual property</h2>
      <p>
        Pursuant to the CSDI Terms of Use, this project:
      </p>
      <ul>
        <li>
          Identifies clearly the Government and the CSDI Portal as the
          source of the Data;
        </li>
        <li>
          Acknowledges the Government and the relevant organisations'
          ownership of the intellectual property rights in the Data and
          in all copies thereof (including paper copies, digital copies
          and copies placed on other websites);
        </li>
        <li>
          Is provided on a free-of-charge basis for both commercial and
          non-commercial browsing, downloading, distribution, reproduction,
          hyperlinking and printing of the Data, in accordance with the
          Terms of Use.
        </li>
      </ul>
      <p>
        "Government" means the Government of the Hong Kong Special
        Administrative Region. The "relevant organisations" are the
        entities listed as each dataset's publisher in the catalogue.
      </p>
    </section>

    <section class="card">
      <h2>CSDI Terms and Conditions of Use</h2>
      <p class="muted">
        The full Terms of Use are reproduced below for in-app reference.
        The authoritative version is published on the
        <a href="https://www.csdi.gov.hk/" target="_blank" rel="noopener noreferrer">CSDI Portal</a>.
        In the event of any conflict or inconsistency between the English
        text and the Chinese translation, the English text shall prevail.
      </p>

      <h3>General</h3>
      <p>
        The CSDI Portal is an online one-stop geospatial information
        service provided by the Development Bureau of the Government of
        the Hong Kong Special Administrative Region (the "Government")
        to the public for obtaining geo-referenced information.
      </p>
      <p>In these Terms and Conditions of Use of the CSDI Portal ("Terms of Use"):</p>
      <ul>
        <li>
          "Data" include the "Spatial Data#" and all other contents
          provided by the Government and/or other organisations (such
          organisations are referred to as "the relevant organisations")
          to the public on the CSDI Portal;
        </li>
        <li>
          "Spatial Data" include all data in the form of digital maps,
          text, graphics, drawings, diagrams, photographs, compilation of
          data, data specifications, metadata and Application Programming
          Interface ("API").
        </li>
      </ul>

      <h3>Use of Data on CSDI Portal</h3>
      <p>
        You are allowed to browse, download, distribute, reproduce,
        hyperlink to and print the Data for both commercial and
        non-commercial purposes on a free-of-charge basis on the condition
        that:
      </p>
      <ul>
        <li>you shall comply with the Terms of Use;</li>
        <li>
          you shall identify clearly the Government and the CSDI Portal
          as the source of the Data and acknowledge the Government and
          the relevant organisations' ownership of the intellectual
          property rights in the Data and in all copies thereof including
          but not limited to paper copies, digital copies and copies
          placed on other websites;
        </li>
        <li>
          you shall indemnify the Government and the relevant
          organisations against any allegations or claims of infringement
          of the rights of any person and all costs, losses, damages and
          liabilities incurred by the Government and the relevant
          organisations, which in any case arise directly or indirectly
          in relation to your use, reproduction and/or distribution of
          the Data.
        </li>
      </ul>

      <h3>Disclaimer and Limitation of Liability</h3>
      <p>
        The Data are provided by the Government and the relevant
        organisations to you on an "as is" and "as available" basis. No
        statement, representation or warranty of any kind (whether express
        or implied) is given by the Government or the relevant
        organisations in relation to the Data (including its accuracy,
        correctness, completeness, non-infringement, reliability, security,
        timeliness and appropriateness of the use of the Data in any
        particular circumstances). The Government or the relevant
        organisations shall not be liable for any errors, omissions,
        deficiencies, inconsistencies, misstatements or misrepresentations
        (express or implied), concerning any Data, and shall not have or
        accept any liability, obligation or responsibility whatsoever for
        any loss, destruction or damage (including without limitation
        consequential loss, destruction or damage or other costs or
        expenses) howsoever arising from or in respect of any use or
        misuse of or reliance on the Data, or any inability to use the
        Data (including any breakdown, suspension, non-function,
        mal-function or interruption of operation of the CSDI Portal).
      </p>
      <p>
        In consideration of the Government and the relevant organisations
        providing the Data on the CSDI Portal, by using the CSDI Portal,
        including the tools, you hereby unconditionally accept the Terms
        of Use. IF YOU DO NOT AGREE TO THE TERMS OF USE, PLEASE DO NOT USE
        THE CSDI PORTAL, INCLUDING THE TOOLS, OR THE DATA PROVIDED THEREON.
        The Terms of Use may be revised and/or amended from time to time
        by the Government or the relevant organisations without prior
        notice to any person. Accessing or using or linking to the CSDI
        Portal or using any Data after such amendments constitutes
        acceptance of such amendments. Please check the Terms of Use
        regularly for any revisions and/or amendments which may be made.
      </p>
      <p>
        The Government and the relevant organisations shall not be
        responsible for any loss or damage whatsoever arising out of or
        in connection with the Data. The Government reserves the right to
        revise, omit or edit the Data or to suspend or terminate the
        provision of the Data, the CSDI Portal or any part thereof at any
        time in its absolute discretion without giving any reason or prior
        notice to any person (including you).
      </p>

      <h3>Linked Information and other Third-Party Websites</h3>
      <p>
        The CSDI Portal may provide or assist in providing links to
        third-party websites through the CSDI Portal. The links are
        produced solely as a convenience to users of the CSDI Portal.
        Provision of, or assistance in providing, any links at the CSDI
        Portal to any third-party website does not give rise to any
        statement, representation or warranty, express or implied, that
        the Government agrees with, approves, recommends or endorses the
        contents of any such third-party websites. The provision of any
        links to third-party websites shall not constitute any form of
        co-operation or affiliation with the Government of any such third
        parties or external websites. The Government shall not have or
        accept any liability, obligation or responsibility whatsoever for
        any loss, destruction or damage (including without limitation
        consequential loss, destruction or damage or other costs or
        expenses) howsoever arising from or in respect of your use or
        misuse of or reliance on, or inability to use such links to any
        third-party website or your use or reliance on the contents of
        any such third-party websites. You should refer to the terms and
        conditions of each such third-party website when using such
        website.
      </p>

      <h3>Privacy Policy</h3>
      <p>
        The Government may record visits to the CSDI Portal without
        collecting your personal data. Information relating to visits to
        the CSDI Portal are collected by the Government for the
        compilation of statistical reports and the investigation and
        diagnosis of problems with or concerning computer systems.
      </p>

      <h3>Intellectual Property Rights</h3>
      <p>
        Unless otherwise indicated, the Government is the owner of the
        intellectual property rights of all contents available on the
        CSDI Portal, including but not limited to all Data.
      </p>

      <h3>Governing Law</h3>
      <p>
        The Terms of Use shall be governed and construed in accordance
        with the laws of the Hong Kong Special Administrative Region of
        the People's Republic of China ("Hong Kong"). You also agree to
        submit to the exclusive jurisdiction of the Hong Kong Courts.
      </p>

      <h3>Chinese text</h3>
      <p>
        In the event of any conflict or inconsistency between the
        English text and the Chinese translation of these Terms of Use,
        the English text shall prevail.
      </p>

      <h3>Note</h3>
      <p>
        "Spatial data" is defined with reference to the definition of
        "Geospatial Data" published by the Open Geospatial Consortium as
        "location properties related to any terrestrial feature or
        phenomena". "Location properties" may include any information
        about the location or area of, and relationships among, and
        descriptive information about geographic features and phenomena.
        This includes remotely sensed data, vector map data, addresses,
        coordinates, etc. Note that "geospatial data" is more precise in
        many contexts than "geographic data" because geospatial data is
        often used in ways that do not involve a graphic representation,
        or map, created from the data.
      </p>
    </section>

    <section class="card">
      <h2>Technology stack</h2>
      <ul class="stack">
        <li><strong>Frontend:</strong> Vue 3, Vite, Vue Router, Pinia, TypeScript, MapLibre GL JS, Vitest, Vue Test Utils</li>
        <li><strong>Backend:</strong> NestJS, TypeORM, class-validator, Swagger, Jest, Supertest</li>
        <li><strong>Database:</strong> PostgreSQL 16 with PostGIS 3</li>
        <li><strong>Map basemap:</strong> OpenStreetMap raster tiles (© OpenStreetMap contributors)</li>
        <li><strong>Tooling:</strong> Docker Compose, nginx (frontend runtime)</li>
      </ul>
    </section>

    <section class="card">
      <h2>Out of scope for this MVP</h2>
      <ul>
        <li>Authentication and authorisation</li>
        <li>External API keys or third-party map services</li>
        <li>Cloud deployment, Kubernetes, or production scaling</li>
        <li>Real STAC server integration</li>
        <li>CesiumJS / ArcGIS SDK / 3D globe rendering</li>
        <li>File upload, dataset editing, or workflow management</li>
        <li>AI-assisted features</li>
      </ul>
    </section>

    <section class="card">
      <h2>Project disclaimer</h2>
      <p>
        GeoCatalog Explorer is a personal demo project provided as-is,
        with no warranty. It is not suitable for operational use. Do not
        use it to make decisions about real-world geography, public
        safety, or any other consequential matter.
      </p>
      <p>
        The CSDI Data themselves are provided on an "as is" and "as
        available" basis with no warranty of accuracy, correctness,
        completeness, non-infringement, reliability, security, timeliness
        or appropriateness; see the full CSDI Terms of Use above. The
        Government and the relevant organisations shall not be liable for
        any loss, destruction or damage arising from any use of, or
        reliance on, the Data.
      </p>
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 880px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.header h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.6rem;
}
.subtitle {
  margin: 0;
  color: #4b5563;
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.1rem 1.2rem;
}
.card h2 {
  margin: 0 0 0.6rem 0;
  font-size: 1.1rem;
  color: #111827;
}
.card h3 {
  margin: 1rem 0 0.4rem 0;
  font-size: 0.95rem;
  color: #1f2937;
}
.card p,
.card ul {
  margin: 0 0 0.6rem 0;
  color: #374151;
  line-height: 1.55;
}
.card ul {
  padding-left: 1.2rem;
}
.card code {
  background: #f3f4f6;
  padding: 0 0.3rem;
  border-radius: 3px;
  font-size: 0.85em;
}
.card a {
  color: #1d4ed8;
}
.card a:hover {
  text-decoration: underline;
}
.muted {
  color: #6b7280;
  font-size: 0.9rem;
}
.stack li,
.card ul li {
  margin-bottom: 0.25rem;
}
</style>
