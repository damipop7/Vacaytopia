import { useNavigate } from 'react-router-dom'
import { useWishlist } from '../../hooks/useWishlist'

const GRADIENTS = {
  'ci-mia': 'from-[#b2e8f8] to-[#7dd8f5]',
  'ci-nyc': 'from-[#c7d9f5] to-[#a8c4ef]',
  'ci-orl': 'from-[#fde8b4] to-[#fbd580]',
  'ci-lv':  'from-[#ddd2f8] to-[#c4b0f3]',
  'ci-no':  'from-[#b5e8d4] to-[#82d9b8]',
  'ci-grn': 'from-[#c8f0d4] to-[#9de3b4]',
}

const CATEGORY_STYLES = {
  'Food & Drink':  'bg-[#fde8b4] text-[#854F0B]',
  'Outdoors':      'bg-[#c8f0d4] text-[#27500A]',
  'Nightlife':     'bg-[#e8e0fb] text-[#3C3489]',
  'Sports':        'bg-[#fde8b4] text-[#854F0B]',
  'Arts & Culture':'bg-[#fce4ef] text-[#72243E]',
  'Wellness':      'bg-[#b5e8d4] text-[#085041]',
}

export default function ExperienceCard({ experience, showForYou = false }) {
  const navigate       = useNavigate()
  const { isSaved, toggleSave, isSaving } = useWishlist()

  if (!experience) return null

  const {
    id, title, city, category, price_per_person,
    duration_label, rating, review_count,
    image_emoji, image_gradient, is_sponsored, _score,
  } = experience

  const saved    = isSaved(id)
  const gradient = GRADIENTS[image_gradient] || GRADIENTS['ci-mia']
  const catStyle = CATEGORY_STYLES[category] || 'bg-gray-100 text-gray-600'
  const isForYou = showForYou && _score && _score >= 60

  return (
    <div
      className="card cursor-pointer overflow-hidden group"
      onClick={() => navigate(`/experience/${id}`)}
    >
      {/* Image area */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center text-5xl`}>
        <span style={{ fontSize: 48 }}>{image_emoji || '🌍'}</span>

        {is_sponsored && (
          <div className="absolute top-2 left-2 bg-white/90 text-[#854F0B] text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold-brand/30">
            ✦ Sponsored
          </div>
        )}

        {isForYou && !is_sponsored && (
          <div className="absolute bottom-2 left-2 bg-gold-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ✨ For You
          </div>
        )}

        {/* Heart button */}
        <button
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
            ${saved
              ? 'bg-red-50 border border-red-200 text-red-500'
              : 'bg-white/90 border border-blue-brand/15 text-gray-400 hover:text-red-400'
            }
            ${isSaving ? 'opacity-60' : 'hover:scale-110'}
          `}
          onClick={(e) => { e.stopPropagation(); toggleSave(id) }}
          disabled={isSaving}
          title={saved ? 'Remove from saved' : 'Save experience'}
        >
          {saved ? '♥' : '♡'}
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <span className={`tag-category ${catStyle} mb-2`}>{category}</span>

        <h3 className="font-display font-bold text-base text-[#0D1B3E] mb-1 leading-snug line-clamp-2 group-hover:text-blue-brand transition-colors">
          {title}
        </h3>

        <div className="text-xs text-gray-400 mb-3 flex items-center gap-1.5 flex-wrap">
          <span>{city}</span>
          {duration_label && <><span>·</span><span>{duration_label}</span></>}
          {review_count > 0 && <><span>·</span><span>{review_count.toLocaleString()} reviews</span></>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-blue-brand/8">
          <div>
            <div className="font-bold text-blue-brand text-base">
              ${price_per_person}
              <span className="text-xs font-normal text-gray-400 ml-0.5">/person</span>
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-0.5 text-[11px] text-gray-500">
                <span className="text-gold-brand">★</span>
                <span>{rating}</span>
              </div>
            )}
          </div>
          <button
            className="btn-primary text-xs px-3 py-1.5"
            onClick={(e) => { e.stopPropagation(); navigate(`/book/${id}`) }}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  )
}
