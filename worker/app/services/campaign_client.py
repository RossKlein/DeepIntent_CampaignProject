import httpx
from fastapi import HTTPException


class CampaignClient:
    def __init__(self, base_url: str, api_key: str) -> None:
        self.base_url = base_url
        self.headers = {"X-API-Key": api_key}

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
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"Campaign API error: {exc.response.text}",
            ) from exc
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Campaign API unavailable: {exc}",
            ) from exc
