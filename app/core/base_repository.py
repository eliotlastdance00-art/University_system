class BaseRepository:
    def __init__(self, conn):
        self.conn = conn

    async def get_by_id(self, id: int) -> dict | None:
        raise NotImplementedError

    async def get_by_id_or_raise(self, id: int) -> dict:
        result = await self.get_by_id(id)
        if result is None:
            raise RuntimeError(f"Row with id={id} not found after write")
        return result