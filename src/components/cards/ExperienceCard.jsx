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

const PHOTOS = {
  'Miami': {
    'Food & Drink':  'photo-1414235077428-338989a2e8c0',
    'Outdoors':      'photo-1507525428034-b723cf961d3e',
    'Nightlife':     'photo-1516450360452-9312f5e86fc7',
    'Sports':        'photo-1571019613454-1cb2f99b2d8b',
    'Arts & Culture':'photo-1545987796-200677ee1011',
    'Wellness':      'photo-1540555700478-4be289fbecef',
  },
  'New York City': {
    'Food & Drink':  'photo-1555396273-367ea4eb4db5',
    'Outdoors':      'photo-1534430480872-3498386e7856',
    'Nightlife':     'photo-1496196614460-48988a57fccf',
    'Sports':        'photo-1461896836934-ffe607ba8211',
    'Arts & Culture':'photo-1549388604-817d15aa0110',
    'Wellness':      'photo-1544161515-4ab6ce6db874',
  },
  'Orlando': {
    'Food & Drink':  'photo-1565299624946-b28f40a0ae38',
    'Outdoors':      'photo-1500534314209-a25ddb2bd429',
    'Nightlife':     'photo-1470229722913-7c0e2dbbafd3',
    'Sports':        'photo-1579952363873-27f3bade9f55',
    'Arts & Culture':'photo-1513364776144-60967b0f800f',
    'Wellness':      'photo-1600334089648-b0d9d3028eb2',
  },
  'Las Vegas': {
    'Food & Drink':  'photo-1504674900247-0877df9cc836',
    'Outdoors':      'photo-1581833971358-2c8b550f87b3',
    'Nightlife':     'photo-1514525253161-7a46d19cd819',
    'Sports':        'photo-1579952363873-27f3bade9f55',
    'Arts & Culture':'photo-1541417904950-b855846fe074',
    'Wellness':      'photo-1515377905703-c4788e51af15',
  },
  'New Orleans': {
    'Food & Drink':  'photo-1466978913421-dad2ebd01d17',
    'Outdoors':      'photo-1531366936337-7c912a4589a7',
    'Nightlife':     'photo-1504196606672-aef5c9cefc92',
    'Sports':        'photo-1517649763962-0c623066013b',
    'Arts & Culture':'photo-1572116469696-31de0f17cc34',
    'Wellness':      'photo-1519824145371-296894a0daa9',
  },
  'Austin': {
    'Food & Drink':  'photo-1558618666-fcd25c85cd64',
    'Outdoors':      'photo-1531366936337-7c912a4589a7',
    'Nightlife':     'photo-1493225457124-a3eb161ffa5f',
    'Sports':        'photo-1517649763962-0c623066013b',
    'Arts & Culture':'photo-1545987796-200677ee1011',
    'Wellness':      'photo-1506126613408-eca07ce68773',
  },
  'Kansas City': {
    'Food & Drink':  'photo-1529543544282-ea669407fca3',
    'Outdoors':      'photo-1441974231531-c6227db76b6e',
    'Nightlife':     'photo-1514525253161-7a46d19cd819',
    'Sports':        'photo-1461896836934-ffe607ba8211',
    'Arts & Culture':'photo-1578662996442-48f60103fc96',
    'Wellness':      'photo-1600618528240-fb9fc964b853',
  },
}

const FALLBACK_PHOTOS = {
  'Food & Drink':  'photo-1414235077428-338989a2e8c0',
  'Outdoors':      'photo-1441974231531-c6227db76b6e',
  'Nightlife':     'photo-1516450360452-9312f5e86fc7',
  'Sports':        'photo-1571019613454-1cb2f99b2d8b',
  'Arts & Culture':'photo-1578662996442-48f60103fc96',
  'Wellness':      'photo-1540555700478-4be289fbecef',
}

function getPhotoUrl(category, city) {
  const photoId =
    PHOTOS[city]?.[category] ||
    FALLBACK_PHOTOS[category] ||
    'photo-1476514525535-07fb3b4ae5f1'
  return `https://images.unsplash.com/${photoId}?w=400&h=300&fit=crop&auto=format&q=80`
}

function getCategoryFallbackUrl(category) {
  const photoId = FALLBACK_PHOTOS[category] || 'photo-1476514525535-07fb3b4ae5f1'
  return `https://images.unsplash.com/${photoId}?w=400&h=300&fit=crop&auto=format&q=80`
}

export { PHOTOS, FALLBACK_PHOTOS, GRADIENTS, CATEGORY_STYLES, getPhotoUrl, getCategoryFallbackUrl }

export default function ExperienceCard({ experience, showForYou = false }) {
  const navigate = useNavigate()
  const { isSaved, toggleSave, isSaving } = useWishlist()

  if (!experience) return null

  const {
    id, title, city, category, price_per_person,
    duration_label, rating, review_count,
    image_emoji, image_gradient, is_sponsored, _score,
    source, website,
  } = experience

  const isOSM = source === 'osm'

  const saved          = isSaved(id)
  const gradient       = GRADIENTS[image_gradient] || GRADIENTS['ci-mia']
  const catStyle       = CATEGORY_STYLES[category] || 'bg-gray-100 text-gray-600'
  const isForYou       = showForYou && _score && _score >= 60
  const photoUrl       = getPhotoUrl(category, city)
  const fallbackPhoto  = getCategoryFallbackUrl(category)

  return (
    <div
      className="card cursor-pointer overflow-hidden group"
      onClick={() => navigate(`/experience/${id}`)}
    >
      <div className={`relative h-44 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <img
          src={photoUrl}
          alt={title}
          width={400}
          height={300}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            if (e.target.src !== fallbackPhoto) {
              e.target.src = fallbackPhoto
            } else {
              e.target.style.display = 'none'
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {is_sponsored && (
          <div className="absolute top-2 left-2 bg-white/90 text-[#854F0B] text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold-brand/30 z-10">
            ✦ Sponsored
          </div>
        )}

        {isForYou && !is_sponsored && (
          <div className="absolute bottom-2 left-2 bg-gold-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
            ✨ For You
          </div>
        )}

        <button
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all z-10
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

      <div className="p-4">
        <span className={`tag-category ${catStyle} mb-2`}>{category}</span>

        <h3 className="font-display font-bold text-base text-[#0D1B3E] mb-1 leading-snug line-clamp-2 group-hover:text-blue-brand transition-colors">
          {title}
        </h3>

        <div className="text-xs text-gray-400 mb-3 flex items-center gap-1.5 flex-wrap">
          <span>{city}</span>
          {duration_label && <><span>·</span><span>{duration_label}</span></>}
          {!isOSM && review_count > 0 && <><span>·</span><span>{review_count.toLocaleString()} reviews</span></>}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-blue-brand/8">
          {isOSM ? (
            <div /> /* empty left side keeps the button right-aligned */
          ) : (
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
          )}
          {isOSM ? (
            website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Visit website →
              </a>
            ) : (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(title + ' ' + city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Search on Google →
              </a>
            )
          ) : (
            <button
              className="btn-primary text-xs px-3 py-1.5"
              onClick={(e) => { e.stopPropagation(); navigate(`/book/${id}`) }}
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
