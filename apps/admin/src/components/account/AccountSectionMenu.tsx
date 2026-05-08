import { ACCOUNT_SECTIONS, type AccountSectionId } from '@/components/account/account-sections'
import { cn } from '@/lib/utils'

interface AccountSectionMenuProps {
  activeSection: AccountSectionId
  onSelect: (section: AccountSectionId) => void
}

export function AccountSectionMenu({ activeSection, onSelect }: Readonly<AccountSectionMenuProps>) {
  return (
    <aside className="rounded-2xl border border-[rgba(169,255,46,0.2)] bg-[rgba(9,16,12,0.86)] p-3">
      <p className="mb-3 px-2 text-xs uppercase tracking-[0.2em] text-gray-400">Conta</p>
      <nav aria-label="Menu de dados da conta" className="space-y-2">
        {ACCOUNT_SECTIONS.map((section) => {
          const isActive = activeSection === section.id
          const Icon = section.icon

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              disabled={!section.enabled}
              className={cn(
                'w-full rounded-xl border px-3 py-3 text-left transition-all duration-200',
                'disabled:cursor-not-allowed disabled:opacity-55',
                isActive
                  ? 'border-[rgba(169,255,46,0.55)] bg-[rgba(169,255,46,0.12)]'
                  : 'border-[rgba(169,255,46,0.12)] bg-[rgba(9,16,12,0.72)] hover:border-[rgba(169,255,46,0.35)]',
              )}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-[rgba(169,255,46,0.14)] p-2">
                  <Icon className="h-4 w-4 text-[#a9ff2e]" />
                </span>
                <span>
                  <strong className="block text-sm text-[#eafff1]">{section.title}</strong>
                  <small className="mt-1 block text-xs text-gray-400">{section.description}</small>
                </span>
              </div>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}