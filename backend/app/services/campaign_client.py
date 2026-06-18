import logging

import httpx

from app.exceptions import CampaignAPIError

logger = logging.getLogger(__name__)


class CampaignClient:
    def __init__(self, base_url: str, api_key: str) -> None:
        self.base_url = base_url
        self.headers = {"X-API-Key": api_key}

    async def fetch_all_campaigns(self) -> list[dict]:
        page = 1
        all_campaigns: list[dict] = []

        while True:
            data = await self.list_campaigns(page=page, page_size=10)
            if isinstance(data, list):
                batch = data
                total = len(data)
            else:
                batch = data.get("campaigns", data.get("items", []))
                total = data.get("total", len(batch))

            if not batch:
                break

            all_campaigns.extend(batch)

            if len(all_campaigns) >= total:
                break
            page += 1

        return all_campaigns

    async def list_campaigns(
        self,
        page: int = 1,
        page_size: int = 10,
        status: str | None = None,
    ) -> dict:
        params: dict[str, int | str] = {
            "page": page,
            "page_size": page_size,
        }
        if status is not None:
            params["status"] = status

        return await self._get("/campaigns", params=params)

    async def get_campaign(self, campaign_id: str) -> dict:
        return await self._get(f"/campaigns/{campaign_id}")

    async def advance_next_day(self) -> dict:
        return await self._post("/next-day")

    async def _get(self, path: str, params: dict | None = None) -> dict:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}{path}",
                    headers=self.headers,
                    params=params,
                    timeout=10.0,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            raise CampaignAPIError(
                f"Campaign API error: {exc.response.text}",
                status_code=exc.response.status_code,
            ) from exc
        except httpx.RequestError as exc:
            raise CampaignAPIError(f"Campaign API unavailable: {exc}") from exc

    async def _post(self, path: str) -> dict:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}{path}",
                    timeout=10.0,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            raise CampaignAPIError(
                f"Campaign API error: {exc.response.text}",
                status_code=exc.response.status_code,
            ) from exc
        except httpx.RequestError as exc:
            raise CampaignAPIError(f"Campaign API unavailable: {exc}") from exc
