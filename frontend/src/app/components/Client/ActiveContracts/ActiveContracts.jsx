import { useState } from "react";
import ContractCard from "./ContractCard";
import Pagination from "@/app/components/Pagination/Pagination";

export default function ActiveContracts() {
    const [page, setPage] = useState(1);
    const totalPage = 3;

    const selectPage = (p) => {
        if (p >= 1 && p <= totalPage) setPage(p);
    };

    const contracts = [1, 2];
    return (
        <div className="rounded-[20px] border border-[rgba(68,68,68,0.08)] w-full">

            {/* Contract List */}
            {contracts.map((_, i) => (
                <ContractCard key={i} />
            ))}

            {/* Pagination */}
            <Pagination
                page={page}
                totalPage={totalPage}
                onChange={selectPage}
            />
        </div>
    );
}
