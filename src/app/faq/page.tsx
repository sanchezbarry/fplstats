

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import Link from "next/link"

export default function Faq() {
  return (
    <>
    <div className="max-w-2xl mx-auto p-4 min-h-screen">
    <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
    <Accordion
      type="single"
      collapsible
      className="w-full min-w-[700px]"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>How do I use FPL League Viewer?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            Simply add in your league ID in the input box and all components will generate based on your leagueId.
          </p>
          <p>
            This was initially designed for the S.a.G FPL League (my own league), but can be used for any league.
            </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I get my leagueId?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            1. Log in to https://fantasy.premierleague.com/ with your fantasy premier league account. 
          </p>
          <p>
            2. Next, click on the Leagues & Cups tab, and click the league that you want the id of. In the url bar is your league ID!
          </p>

        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>General League Data</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            This is for general league data such as high scoring players, dream teams, etc.
          </p>
        </AccordionContent>
      </AccordionItem>

       <AccordionItem value="item-4">
        <AccordionTrigger>Background Info</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
           FPL Stats is simply a personal project of mine. Oliver Looney&apos;s very helpful <Link className="underline" target="_blank" href="https://www.oliverlooney.com/blogs/FPL-APIs-Explained">blog post</Link> carefully explained how 
           most of APIs can be used to get FPL data.
          </p>

            <p>
           For other projects or to contact me for work, visit my website at <Link className="underline" target="_blank" href="https://sanchezbarry.com">sanchezbarry.com</Link>.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    </div>
    </>
  )
}
