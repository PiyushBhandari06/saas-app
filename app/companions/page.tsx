import Companioncard from "@/components/Companioncard";
import SearchInput from "@/components/SearchInput";
import Subjectfilter from "@/components/Subjectfilter";
import { getAllCompanions } from "@/lib/actions/companion.action";
import { getSubjectColor } from "@/lib/utils";


const CompanionsLibrary = async ({searchParams}:SearchParams) => {
  const filters = await searchParams;
  const subject = filters.subject ? filters.subject : '';
  const topic = filters.topic ? filters.topic : '';

  const companions = await getAllCompanions({ subject, topic });

  console.log(companions);

  return (
    <main>
      <section className="flex justify-between gap-4 max-sm:flex-col">
        <h1>Companion Library</h1>

        <div className="flex gap-4">
          <SearchInput/>
          <Subjectfilter/>
        </div>
      </section>

      <section className="companions-grid">
        {companions.map((companion)=>(
          <Companioncard 
          key={companion.id} 
          {...companion}
          color={getSubjectColor(companion.subject)}
          />

        ))}

      </section>

    </main>
  )
}

export default CompanionsLibrary
