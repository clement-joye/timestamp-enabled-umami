import { CLICKHOUSE, RELATIONAL, URL_LENGTH } from 'lib/constants';
import {
  getDateFormatClickhouse,
  prisma,
  rawQueryClickhouse,
  runAnalyticsQuery,
  runQuery,
} from 'lib/db';

export async function savePageView(...args) {
  return runAnalyticsQuery({
    [`${RELATIONAL}`]: () => relationalQuery(...args),
    [`${CLICKHOUSE}`]: () => clickhouseQuery(...args),
  });
}

async function relationalQuery(website_id, { session_id, url, referrer, created_at }) {
  return runQuery(
    prisma.pageview.create({
      data: {
        created_at,
        website_id,
        session_id,
        url: url?.substr(0, URL_LENGTH),
        referrer: referrer?.substr(0, URL_LENGTH),
      },
    }),
  );
}

async function clickhouseQuery(website_id, { session_uuid, url, referrer, created_at }) {
  const params = [
    created_at,
    website_id,
    session_uuid,
    url?.substr(0, URL_LENGTH),
    referrer?.substr(0, URL_LENGTH),
  ];

  return rawQueryClickhouse(
    `
    insert into umami_dev.pageview (created_at, website_id, session_uuid, url, referrer)
    values ($0, $1, $2, $3, $4);`,
    params,
  );
}
