import MarkdownRenderer from '../../../shared/ui/display/MarkdownRenderer.jsx'

export default function QuestionDisplay({ question, type }) {
  return (
    <h2 className="mt-8 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
      <MarkdownRenderer text={question} />
    </h2>
  )
}
